import 'package:get/get.dart';

import '../controllers/test_machine_controller.dart';

class TestMachineBinding extends Bindings {
  @override
  void dependencies() {
    Get.lazyPut<TestMachineController>(
      () => TestMachineController(),
    );
  }
}
