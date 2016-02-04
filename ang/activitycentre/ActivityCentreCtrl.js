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
          }
        }
      });
    }
  );

  // The controller uses *injection*. This default injects a few things:
  //   $scope -- This is the set of variables shared between JS and HTML.
  //   crmApi, crmStatus, crmUiHelp -- These are services provided by civicrm-core.
  //   myContact -- The current contact, defined above in config().
  angular.module('activitycentre').controller('ActivitycentreActivityCentreCtrl', function($scope, crmApi, crmStatus, crmUiHelp, activities, $routeParams) {

    crmApi('Case', 'get', {
      contact_id: $routeParams.contactId,
      return: ['id']
    }).then(function(caseSummaries) {
      var caseIds = Object.keys(caseSummaries.values);
      console.log(caseIds);
      crmApi('Case', 'get', {
        case_id: caseIds    
      }).then(function(cases) {
        caseIds.forEach(function(caseId) {
          crmApi('Activity', 'get', {
            activity_id: cases.values[caseId].activities
          }).then(function(activities) {
            console.log(activities);
            activities.forEach(function(activity) {
              activity.case_id = theCase.id;
              $scope.activities[id] = activities[id] = activity;
            });
          });
        });
      });
    });
   
    // The ts() and hs() functions help load strings for this module.
    var ts = $scope.ts = CRM.ts('activitycentre');
    var hs = $scope.hs = crmUiHelp({file: 'CRM/activitycentre/ActivityCentreCtrl'}); // See: templates/CRM/activitycentre/ActivityCentreCtrl.hlp

  });
          
})(angular, CRM.$, CRM._);
