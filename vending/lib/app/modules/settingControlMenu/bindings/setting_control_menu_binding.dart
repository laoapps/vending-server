import 'package:get/get.dart';

import '../controllers/setting_control_menu_controller.dart';

class SettingControlMenuBinding extends Bindings {
  @override
  void dependencies() {
    Get.lazyPut<SettingControlMenuController>(
      () => SettingControlMenuController(),
    );
  }
}
