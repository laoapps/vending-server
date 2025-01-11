import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:get_storage/get_storage.dart';
import 'package:vending/app/data/languages_key.dart';
import 'package:vending/app/functions/showlogs.dart';
import 'package:vending/app/modules/home/controllers/home_controller.dart';
import 'package:vending/widget/dialog/showdialog.dart';

import '../../../data/storage_key.dart';

class SettingMachineController extends GetxController {
  final formkey = GlobalKey<FormState>();
  final wsUrl = TextEditingController();
  final url = TextEditingController();
  final machineId = TextEditingController();
  final otp = TextEditingController();
  final contact = TextEditingController();
  final fallLimit = TextEditingController();
  HomeController homeCon = Get.find<HomeController>();
  var storage = GetStorage();

  var adsMode = false.obs;
  var franciseMode = true.obs;
  var muteRobotSound = false.obs;
  var muteMusic = true.obs;

  @override
  void onInit() {
    initValueLocal();
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

  initValueLocal() {
    // print('initValueLocal');
    wsUrl.text = storage.read(StorageKey.wsUrl) ?? '';
    url.text = storage.read(StorageKey.url) ?? '';
    machineId.text = storage.read(StorageKey.machineId) ?? '';
    otp.text = storage.read(StorageKey.otp) ?? '';
    contact.text = storage.read(StorageKey.contact) ?? '';
    fallLimit.text = storage.read(StorageKey.productFallLimit) ?? '';
  }

  saveSetting() {
    try {
      if (formkey.currentState!.validate()) {
        ShowDialog.showDialogConfirm(Lang.save.tr, () {
          storage.write(StorageKey.wsUrl, wsUrl.text);
          storage.write(StorageKey.url, url.text);
          storage.write(StorageKey.machineId, machineId.text);
          storage.write(StorageKey.otp, otp.text);
          storage.write(StorageKey.contact, contact.text);
          storage.write(StorageKey.productFallLimit, fallLimit.text);
          storage.write(StorageKey.adsMode, adsMode.value);
          storage.write(StorageKey.muteRobotSound, muteRobotSound.value);
          storage.write(StorageKey.muteMusic, muteMusic.value);
          storage.write(StorageKey.franciseMode, franciseMode.value);
          storage.write(StorageKey.musicVolume, homeCon.musicVolume.value);
          homeCon.loadMachineSale();
          ShowDialog.showDialogSuccess("ແກ້ໄຂຂໍ້ມູນສຳເຫຼັດ");
        });
      }
    } catch (e, stackTrace) {
      ShowLogs().f('saveSetting error ${e}', stackTrace);
    }
  }

  clearCash() {
    try {
      ShowDialog.showDialogConfirm(Lang.clear.tr, () {
        storage.erase();
        // homeCon.initValueLocal();
        // initValueLocal();
      });
    } catch (e, stackTrace) {
      ShowLogs().f('clearCash error ${e}', stackTrace);
    }
  }
}
