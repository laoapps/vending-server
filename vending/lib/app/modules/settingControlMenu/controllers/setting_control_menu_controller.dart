import 'package:get/get.dart';
import 'package:vending/app/modules/home/controllers/home_controller.dart';
import 'package:vending/widget/dialog/showdialog.dart';

class SettingControlMenuController extends GetxController {
  HomeController homeCon = Get.find<HomeController>();
  @override
  void onInit() {
    dialogWarning();
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

  dialogWarning() async {
    await Future.delayed(Duration(milliseconds: 10));
    ShowDialog.showDialogSuccess("ທຸກການປ່ຽນແປງຈະຖືກບັນທຶກອັດຕະໂນມັດ");
  }
}
