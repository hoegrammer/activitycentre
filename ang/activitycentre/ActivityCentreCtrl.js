(function(angular, $, _) {

  angular.module('activitycentre').config(function($routeProvider) {
      $routeProvider.when('/activitycentre/:contactId', {
        controller: 'ActivitycentreActivityCentreCtrl',
        templateUrl: '~/activitycentre/ActivityCentreCtrl.html',

        // If you need to look up data when opening the page, list it out
        // under "resolve".
        resolve: {
          myContact: function(crmApi) {
            return crmApi('Contact', 'getsingle', {
              id: 'user_contact_id',
              return: ['first_name', 'last_name']
            });
          }
        }
      });
    }
  );

  // The controller uses *injection*. This default injects a few things:
  //   $scope -- This is the set of variables shared between JS and HTML.
  //   crmApi, crmStatus, crmUiHelp -- These are services provided by civicrm-core.
  //   myContact -- The current contact, defined above in config().
  angular.module('activitycentre').controller('ActivitycentreActivityCentreCtrl', function($scope, crmApi, crmStatus, crmUiHelp, myContact, $routeParams) {
      console.log($routeParams);
    // The ts() and hs() functions help load strings for this module.
    var ts = $scope.ts = CRM.ts('activitycentre');
    var hs = $scope.hs = crmUiHelp({file: 'CRM/activitycentre/ActivityCentreCtrl'}); // See: templates/CRM/activitycentre/ActivityCentreCtrl.hlp

    // We have myContact available in JS. We also want to reference it in HTML.
    $scope.myContact = myContact;

    $scope.save = function save() {
      return crmStatus(
        // Status messages. For defaults, just use "{}"
        {start: ts('Saving...'), success: ts('Saved')},
        // The save action. Note that crmApi() returns a promise.
        crmApi('Contact', 'create', {
          id: myContact.id,
          first_name: myContact.first_name,
          last_name: myContact.last_name
        })
      );
    };
  });

})(angular, CRM.$, CRM._);
