import 'package:get/get.dart';
// import 'package:vending/app/modules/home/controllers/home_controller.dart';
import 'package:vending/widget/dialog/showdialog.dart';

class SettingControlMenuController extends GetxController {
  // HomeController homeCon = Get.find<HomeController>();
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

  var isTickets = true.obs;
  var isHowTo = true.obs;
  var isCashOut = true.obs;
  var isCashOutLAABAccount = true.obs;
  var isCashOutLAABEPIN = true.obs;
  var isCashOutMMoneyAccount = true.obs;
  var isCashIn = true.obs;
  var isTemperature = true.obs;
  var isWhatsapp = true.obs;
  var isIOSandAndroidQRLink = true.obs;
  var isCashOutVietcomBank = true.obs;
  var isCashOutBOCbank = true.obs;
  var isCashOutBCAbank = true.obs;
  var isCashOutMCBbank = true.obs;
  var isCashOutVietinBank = true.obs;
  var isCashOutKasikornBank = true.obs;
  var isCashOutDBSbank = true.obs;
  var isCashOutICBCbank = true.obs;
  var isCashOutBangkokBank = true.obs;
  var isCashOutAbank = true.obs;

  dialogWarning() async {
    await Future.delayed(Duration(milliseconds: 10));
    ShowDialog.showDialogSuccess("ທຸກການປ່ຽນແປງຈະຖືກບັນທຶກອັດຕະໂນມັດ");
  }
}
