<?php

require_once 'activitycentre.civix.php';
function activitycentre_civicrm_alterAPIPermissions($entity, $action, &$params, &$permissions)
{

  if ($entity == 'case_activity') {
    $params['check_permissions'] = 0;
  }
}

// Don't show activity tab for clients. It frightens the children
function activitycentre_civicrm_tabset($tabsetName, &$tabs, $context) {
  if ($tabsetName === "civicrm/contact/view") {
    $result =  civicrm_api3("Contact", "getsingle", array(
      "id" => $context['contact_id'], 
      "sequential" => 1,
      "return" => array("contact_sub_type"))
    );
    if (is_array($result['contact_sub_type']) && in_array('Client', $result['contact_sub_type'])) {
      foreach($tabs as $index => $tab) {
        if ($tab['id'] === 'activity') {
          unset($tabs[$index]);
          return;
        }
      }
    }
  }
}

/**
 * Implements hook_civicrm_config().
 *
 * @link http://wiki.civicrm.org/confluence/display/CRMDOC/hook_civicrm_config
 */
function activitycentre_civicrm_config(&$config) {
  _activitycentre_civix_civicrm_config($config);
}

/**
 * Implements hook_civicrm_xmlMenu().
 *
 * @param array $files
 *
 * @link http://wiki.civicrm.org/confluence/display/CRMDOC/hook_civicrm_xmlMenu
 */
function activitycentre_civicrm_xmlMenu(&$files) {
  _activitycentre_civix_civicrm_xmlMenu($files);
}

/**
 * Implements hook_civicrm_install().
 *
 * @link http://wiki.civicrm.org/confluence/display/CRMDOC/hook_civicrm_install
 */
function activitycentre_civicrm_install() {
  _activitycentre_civix_civicrm_install();
}

/**
 * Implements hook_civicrm_uninstall().
 *
 * @link http://wiki.civicrm.org/confluence/display/CRMDOC/hook_civicrm_uninstall
 */
function activitycentre_civicrm_uninstall() {
  _activitycentre_civix_civicrm_uninstall();
}

/**
 * Implements hook_civicrm_enable().
 *
 * @link http://wiki.civicrm.org/confluence/display/CRMDOC/hook_civicrm_enable
 */
function activitycentre_civicrm_enable() {
  _activitycentre_civix_civicrm_enable();
}

/**
 * Implements hook_civicrm_disable().
 *
 * @link http://wiki.civicrm.org/confluence/display/CRMDOC/hook_civicrm_disable
 */
function activitycentre_civicrm_disable() {
  _activitycentre_civix_civicrm_disable();
}

/**
 * Implements hook_civicrm_upgrade().
 *
 * @param $op string, the type of operation being performed; 'check' or 'enqueue'
 * @param $queue CRM_Queue_Queue, (for 'enqueue') the modifiable list of pending up upgrade tasks
 *
 * @return mixed
 *   Based on op. for 'check', returns array(boolean) (TRUE if upgrades are pending)
 *                for 'enqueue', returns void
 *
 * @link http://wiki.civicrm.org/confluence/display/CRMDOC/hook_civicrm_upgrade
 */
function activitycentre_civicrm_upgrade($op, CRM_Queue_Queue $queue = NULL) {
  return _activitycentre_civix_civicrm_upgrade($op, $queue);
}

/**
 * Implements hook_civicrm_managed().
 *
 * Generate a list of entities to create/deactivate/delete when this module
 * is installed, disabled, uninstalled.
 *
 * @link http://wiki.civicrm.org/confluence/display/CRMDOC/hook_civicrm_managed
 */
function activitycentre_civicrm_managed(&$entities) {
  _activitycentre_civix_civicrm_managed($entities);
}

/**
 * Implements hook_civicrm_caseTypes().
 *
 * Generate a list of case-types.
 *
 * @param array $caseTypes
 *
 * Note: This hook only runs in CiviCRM 4.4+.
 *
 * @link http://wiki.civicrm.org/confluence/display/CRMDOC/hook_civicrm_caseTypes
 */
function activitycentre_civicrm_caseTypes(&$caseTypes) {
  _activitycentre_civix_civicrm_caseTypes($caseTypes);
}

/**
 * Implements hook_civicrm_angularModules().
 *
 * Generate a list of Angular modules.
 *
 * Note: This hook only runs in CiviCRM 4.5+. It may
 * use features only available in v4.6+.
 *
 * @link http://wiki.civicrm.org/confluence/display/CRMDOC/hook_civicrm_caseTypes
 */
function activitycentre_civicrm_angularModules(&$angularModules) {
_activitycentre_civix_civicrm_angularModules($angularModules);
}

/**
 * Implements hook_civicrm_alterSettingsFolders().
 *
 * @link http://wiki.civicrm.org/confluence/display/CRMDOC/hook_civicrm_alterSettingsFolders
 */
function activitycentre_civicrm_alterSettingsFolders(&$metaDataFolders = NULL) {
  _activitycentre_civix_civicrm_alterSettingsFolders($metaDataFolders);
}

/**
 * Functions below this ship commented out. Uncomment as required.
 *

/**
 * Implements hook_civicrm_preProcess().
 *
 * @link http://wiki.civicrm.org/confluence/display/CRMDOC/hook_civicrm_preProcess
 *
function activitycentre_civicrm_preProcess($formName, &$form) {

} // */

/**
 * Implements hook_civicrm_navigationMenu().
 *
 * @link http://wiki.civicrm.org/confluence/display/CRMDOC/hook_civicrm_navigationMenu
 *
function activitycentre_civicrm_navigationMenu(&$menu) {
  _activitycentre_civix_insert_navigation_menu($menu, NULL, array(
    'label' => ts('The Page', array('domain' => 'com.example.activitycentre')),
    'name' => 'the_page',
    'url' => 'civicrm/the-page',
    'permission' => 'access CiviReport,access CiviContribute',
    'operator' => 'OR',
    'separator' => 0,
  ));
  _activitycentre_civix_navigationMenu($menu);
} // */
