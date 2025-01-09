import 'package:get/get.dart';

import '../modules/home/bindings/home_binding.dart';
import '../modules/home/views/home_view.dart';
import '../modules/manageStock/bindings/manage_stock_binding.dart';
import '../modules/manageStock/views/manage_stock_view.dart';
import '../modules/settingControlMenu/bindings/setting_control_menu_binding.dart';
import '../modules/settingControlMenu/views/setting_control_menu_view.dart';
import '../modules/settingMachine/bindings/setting_machine_binding.dart';
import '../modules/settingMachine/views/setting_machine_view.dart';
import '../modules/testMachine/bindings/test_machine_binding.dart';
import '../modules/testMachine/views/test_machine_view.dart';

part 'app_routes.dart';

class AppPages {
  AppPages._();

  static const INITIAL = Routes.HOME;

  static final routes = [
    GetPage(
      name: _Paths.HOME,
      page: () => const HomeView(),
      binding: HomeBinding(),
    ),
    GetPage(
      name: _Paths.MANAGE_STOCK,
      page: () => const ManageStockView(),
      binding: ManageStockBinding(),
    ),
    GetPage(
      name: _Paths.SETTING_MACHINE,
      page: () => const SettingMachineView(),
      binding: SettingMachineBinding(),
    ),
    GetPage(
      name: _Paths.SETTING_CONTROL_MENU,
      page: () => const SettingControlMenuView(),
      binding: SettingControlMenuBinding(),
    ),
    GetPage(
      name: _Paths.TEST_MACHINE,
      page: () => const TestMachineView(),
      binding: TestMachineBinding(),
    ),
  ];
}
