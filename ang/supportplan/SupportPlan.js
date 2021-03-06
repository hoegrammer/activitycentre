(function(angular, $, _) {

  angular.module('supportplan').config(function($routeProvider) {
      $routeProvider.when('/supportplan/:contactId', {
        controller: 'ActivitycentreSupportPlanCtrl',
        templateUrl: '~/activitycentre/SupportPlanCtrl.html',
      });
    }
  );

  angular.module('supportplan').controller('ActivitycentreSupportPlanCtrl', function($scope, crmApi, crmStatus, crmUiHelp, $routeParams) {

    var now = new Date();
    var defaultOptionText = '--all--';
    var defaultCaseType = {id: 0, title: defaultOptionText};
    var defaultActivityType = {name: defaultOptionText};

    $scope.activities = [];
    $scope.activityTypes = [];
    $scope.activityTypeOptions = [];
    $scope.activityTypeName = defaultActivityType;
    $scope.contact = {};
    $scope.caseTypes = [];
    $scope.caseTypeOptions = [];
    $scope.caseTypeId = defaultCaseType.id;
 
    loadActivities();
    loadContact();
    loadCaseTypes();

    function loadContact() {
      crmApi('Contact', 'getSingle', {
        contact_id: $routeParams.contactId,
        return: ['first_name', 'last_name']
      }).then(function(contact) {
        $scope.contact = contact;
      });
    }

    function loadCaseTypes() {
      crmApi('CaseType', 'get', {
        sequential: 1,
        is_active: 1
      }).then(function(caseTypes) {
        $scope.caseTypes = _.sortBy(caseTypes.values, 'name');
        $scope.caseTypeOptions = makeOptions(defaultCaseType, $scope.caseTypes);
      });
    }

    function makeOptions(defaultOption, list) {
      return [defaultOption].concat(list);
    }

    function isOverdue(activity) {
      return new Date(activity.activity_date_time) < now && activity.status === "Scheduled";
    }

    function loadActivities(callback) {
      crmApi('Case', 'get', {
        contact_id: $routeParams.contactId,
        is_deleted: 0,
        sequential: 1,
        return: ['id', 'case_type_id', 'case_type_id.title']
      }).then(function(cases) {
        $scope.cases = cases.values;
        cases.values.forEach(function(_case) {
          crmApi('CaseActivity', 'get', {
            case_id: _case.id,
            sequential: 1,
            return: ['activity_id', 'activity_type', 'subject', 'activity_date_time', 'status']
          }).then(function(activities) {
            activities.values.forEach(function(activity) {  
              // We don't need to update existing activities, because Civi creates a new
              // activity for each revision.
              // We don't want to show Open Case activities.
              if (!_.find($scope.activities, activity) && activity.activity_type !== "Open Case") {
                activity['case_type'] = _case['case_type_id.title'];
                activity['case_id'] = _case.id;
                activity['case_type_id'] = _case['case_type_id'];
                activity['overdue_status'] = isOverdue(activity) ? "status-overdue" : "";
                $scope.activities.push(activity);
                $scope.activities = _.sortBy($scope.activities, 'activity_date_time').reverse();
                if (callback) callback();
              }
            });
            filterActivities();
          });
        });
      });
    }

    function removeActivityFromScope(activity) {
      $scope.activities = _.without($scope.activities, activity)
    }

    $scope.setCaseType = function() {
      if ($scope.caseTypeId > 0) {
        $scope.caseType = _.find($scope.caseTypes, {id: $scope.caseTypeId});
        $scope.activityTypes = _.sortBy($scope.caseType.definition.activityTypes, 'name');
        $scope.activityTypeOptions = makeOptions(defaultActivityType, $scope.activityTypes);
      }
      delete $scope.activityType;
      filterActivities();
    }

    $scope.setActivityType = function() {
      // The "all" option is an object; the others are just names.
      if ($scope.activityTypeName.id !== 0) {
        crmApi('optionValue', 'get', {
          sequential: 1,
          label: $scope.activityTypeName
        }).then(function(activityTypes) {
          $scope.activityType = activityTypes.values[0];
          filterActivities();
        });
      } else {
        delete $scope.activityType;
        filterActivities();
      }
    }
    
    function filterActivities() {
        $scope.filteredActivities = $scope.activityType 
          ? $scope.activities.filter(function(activity) {return activity.activity_type_id === $scope.activityType.value})
          : ($scope.caseTypeId 
            ? $scope.activities.filter(function(activity) {return activity.case_type_id === $scope.caseTypeId})
            : $scope.activities);
    }

    $scope.createActivity = function() {
      var activityTypeId = $scope.activityType.value; // value rather than id, because it's an optionValue entity
      var existingCaseOfCorrectType = _.find($scope.cases, {case_type_id: $scope.caseType.id});
      if (existingCaseOfCorrectType) {
        showCreatePopup(existingCaseOfCorrectType.id, activityTypeId);
      } else {
        crmApi('Case', 'create', {
          contact_id: $routeParams.contactId, case_type_id: $scope.caseType.name, subject: $scope.caseType.title
        }).then(function(newlyCreatedCase) {
          showCreatePopup(newlyCreatedCase.id, activityTypeId, true);
        });  
      }
    }

    function showCreatePopup(caseId, activityTypeId, deleteCaseOnCancel) {
      var onClose = function(event) {
        // If close event was triggered by 'x' button click, it's a cancel
        if (event.originalEvent && event.originalEvent.currentTarget.className === "ui-dialog-titlebar-close") {
          onCancel();
        }
      }
      var onCancel = function() {
        if (deleteCaseOnCancel) {
          crmApi('Case', 'delete', {
            case_id: caseId 
          });
        }
      };
      CRM.loadForm('/civicrm/case/activity?action=add&reset=1&cid=' + $routeParams.contactId + '&caseid=' + caseId  + '&atype=' + activityTypeId + '&snippet=json', {dialog: {close: onClose}}).on('crmFormSuccess', function() {
        loadActivities();
      }).on('crmFormCancel', onCancel);
    }

    $scope.nothingToCreate = function() {
      return !$scope.activityType;
    }

    $scope.viewActivity = function(activity) {
      CRM.loadForm('/civicrm/case/activity/view?aid=' + activity.activity_id + '&cid=' + $routeParams.contactId);
    }

    $scope.editActivity = function(activity) {
      var url = '/civicrm/case/activity?id=' + activity.activity_id + '&cid=' + $routeParams.contactId + '&caseid=' + activity['case_id'] 
          + '&reset=1&action=update&snippet=json';
      CRM.loadForm(url).on('crmFormSuccess', function(event, data) {
        loadActivities(function() {removeActivityFromScope(activity);});
      });
    }
    $scope.deleteActivity = function(activity) {
      var url = '/civicrm/case/activity?reset=1&cid=' + $routeParams.contactId + '&caseid=' + activity.case_id  +  '&action=delete&id=' + activity.activity_id + '&snippet=json';
      CRM.loadForm(url).on('crmFormSuccess', function(event, data) {
        // Yes, it returns success on failure and a handy string to match on.
        if (data.crmMessages[0].title !== 'Selected Activity cannot be deleted.') {
          // Using $apply because God knows why but screen wasn't updating without it
          $scope.$apply(function() {
            removeActivityFromScope(activity);
            filterActivities();
          });
        }
      });
    }

    // The ts() and hs() functions help load strings for this module.
    var ts = $scope.ts = CRM.ts('activitycentre');
    var hs = $scope.hs = crmUiHelp({file: 'CRM/activitycentre/ActivityCentreCtrl'}); // See: templates/CRM/activitycentre/ActivityCentreCtrl.hlp

  });
          
})(angular, CRM.$, CRM._);
