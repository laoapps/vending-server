import 'package:get/get.dart';
import 'package:vending/app/functions/showlogs.dart';
import 'package:vending/widget/dialog/showdialog.dart';
import '../../../controllers/zdm8_controller.dart';

class TestMachineController extends GetxController {
  dynamic serial = SerialCommunication(portPath: '/dev/ttyS1');

  @override
  void onInit() {
    super.onInit();
  }

  @override
  void onReady() {
    super.onReady();
  }

  @override
  void onClose() {
    super.onClose();
  }

  testMachine() async {
    try {
      final controller = ZDM8Controller(serial);
      await controller.queryStatus();
      await controller.shippingControl(1, true);
      await controller.queryDropDetectionStatus();
      await controller.dropItem(
          slot: 2, enableDropDetect: true, enableLiftSystem: true);
    } catch (e, stackTrace) {
      ShowLogs().f("Error testMachine is : $e", stackTrace);
      ShowDialog.showDialogbox('${e.toString()}');
    }
  }
}
