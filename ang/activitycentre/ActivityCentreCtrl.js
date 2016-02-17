(function(angular, $, _) {

  angular.module('activitycentre').config(function($routeProvider) {
      $routeProvider.when('/activitycentre/:contactId', {
        controller: 'ActivitycentreActivityCentreCtrl',
        templateUrl: '~/activitycentre/ActivityCentreCtrl.html',

        // If you need to look up data when opening the page, list it out
        // under "resolve".
        resolve: {
          activities: function(crmApi) {
              return [];
          },
          contact: function(crmApi) {
              return {};
          },
          caseTypes: function(crmApi) {
              return [];
          }
        }
      });
    }
  );

  // The controller uses *injection*. This default injects a few things:
  //   $scope -- This is the set of variables shared between JS and HTML.
  //   crmApi, crmStatus, crmUiHelp -- These are services provided by civicrm-core.
  //   myContact -- The current contact, defined above in config().
  angular.module('activitycentre').controller('ActivitycentreActivityCentreCtrl', function($scope, crmApi, crmStatus, crmUiHelp, activities, contact, caseTypes, $routeParams) {


    $scope.activities = activities;
    $scope.contact = contact;
    $scope.caseTypes = caseTypes;
 
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
        sequential: 1
      }).then(function(caseTypes) {
        $scope.caseTypes = caseTypes.values;
      });
    }

    function loadActivities(callback) {
      crmApi('Case', 'get', {
        contact_id: $routeParams.contactId,
        sequential: 1,
        return: ['id', 'case_type_id.title']
      }).then(function(cases) {
        cases.values.forEach(function(_case) {
          crmApi('CaseActivity', 'get', {
            case_id: _case.id,
            sequential: 1,
            return: ['activity_id', 'activity_type', 'subject', 'activity_date_time', 'status']
          }).then(function(activities) {
            activities.values.forEach(function(activity) {  
              if (!_.find($scope.activities, activity)) {
                activity['case_type'] = _case['case_type_id.title'];
                activity['case_id'] = _case.id;
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
      $scope.activities = _.without($scope.activities, activity);
    }

    $scope.setCaseType = function(caseType) {
      console.log(caseType);
      $scope.caseType = caseType;
    }

    $scope.viewActivity = function(activity) {
      CRM.loadForm('/civicrm/case/activity/view?aid=' + activity.activity_id + '&cid=' + $routeParams.contactId);
    }

    $scope.editActivity = function(activity) {
      var url = '/civicrm/case/activity?id=' + activity.activity_id + '&cid=' + $routeParams.contactId + '&caseid=' + activity['case_id'] 
          + '&reset=1&action=update&snippet=json';
      CRM.loadForm(url).on('crmFormSuccess', function(event, data) {
        console.log(data);
        loadActivities(function() {removeActivity(activity);});
      });
    }
    $scope.deleteActivity = function(activity) {
      var url = '/civicrm/case/activity?reset=1&cid=' + $routeParams.contactId + '&caseid=' + activity.case_id  +  '&action=delete&id=' + activity.activity_id + '&snippet=json';
      CRM.loadForm(url).on('crmFormSuccess', function() {
        removeActivityFromScope(activity);
      });
    }

    // The ts() and hs() functions help load strings for this module.
    var ts = $scope.ts = CRM.ts('activitycentre');
    var hs = $scope.hs = crmUiHelp({file: 'CRM/activitycentre/ActivityCentreCtrl'}); // See: templates/CRM/activitycentre/ActivityCentreCtrl.hlp

  });
          
})(angular, CRM.$, CRM._);
