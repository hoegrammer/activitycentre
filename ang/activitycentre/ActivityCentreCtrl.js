(function(angular, $, _) {

  angular.module('activitycentre').config(function($routeProvider) {
      $routeProvider.when('/activitycentre/:contactId', {
        controller: 'ActivitycentreActivityCentreCtrl',
        templateUrl: '~/activitycentre/ActivityCentreCtrl.html',
      });
    }
  );

  angular.module('activitycentre').controller('ActivitycentreActivityCentreCtrl', function($scope, crmApi, crmStatus, crmUiHelp, $routeParams) {

    var now = new Date();

    $scope.activities = [];
    $scope.activityTypes = [];
    $scope.contact = {};
    $scope.caseTypes = [];
 
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
      });
    }

    function isOverdue(activity) {
      return new Date(activity.activity_date_time) < now && activity.status === "Scheduled";
    }

    function loadActivities(callback) {
      crmApi('Case', 'get', {
        contact_id: $routeParams.contactId,
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
                activity['overdue_status'] = isOverdue(activity) ? "status-overdue" : "";
                $scope.activities.push(activity);
                $scope.activities = _.sortBy($scope.activities, 'activity_date_time').reverse();
                if (callback) callback();
              }
            });
          });
        });
      });
    }

    function removeActivityFromScope(activity) {
      // Using $apply because God knows why but it wasn't updating without it
      $scope.$apply(function() {$scope.activities = _.without($scope.activities, activity)});
    }

    $scope.setCaseType = function() {
      $scope.caseType = _.find($scope.caseTypes, {id: $scope.caseTypeId});
      $scope.activityTypes = _.sortBy($scope.caseType.definition.activityTypes, 'name');
      delete $scope.activityType; // otherwise create button remains enabled
    }

    $scope.setActivityType = function() {
      crmApi('optionValue', 'get', {
        sequential: 1,
        label: $scope.activityTypeName
      }).then(function(activityTypes) {
        $scope.activityType = activityTypes.values[0];
      });
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
          showCreatePopup(newlyCreatedCase.id, activityTypeId);
        });  
      }
    }

    function showCreatePopup(caseId, activityTypeId) {
      CRM.loadForm('/civicrm/case/activity?action=add&reset=1&cid=' + $routeParams.contactId + '&caseid=' + caseId  + '&atype=' + activityTypeId + '&snippet=json').on('crmFormSuccess', function(event, data) {
        loadActivities();
      });
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
          removeActivityFromScope(activity);
        }
      });
    }

    // The ts() and hs() functions help load strings for this module.
    var ts = $scope.ts = CRM.ts('activitycentre');
    var hs = $scope.hs = crmUiHelp({file: 'CRM/activitycentre/ActivityCentreCtrl'}); // See: templates/CRM/activitycentre/ActivityCentreCtrl.hlp

  });
          
})(angular, CRM.$, CRM._);
