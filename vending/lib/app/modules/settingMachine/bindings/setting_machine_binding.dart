import 'package:get/get.dart';

import '../controllers/setting_machine_controller.dart';

class SettingMachineBinding extends Bindings {
  @override
  void dependencies() {
    Get.lazyPut<SettingMachineController>(
      () => SettingMachineController(),
    );
  }
}
