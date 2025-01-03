import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:get_storage/get_storage.dart';
import 'package:just_audio/just_audio.dart';
import 'package:vending/app/controllers/connectwebsocket.dart';
import 'package:vending/app/data/ecommand.dart';
import 'package:vending/app/data/storage_key.dart';
import 'package:vending/app/functions/check_response.dart';
import 'package:vending/app/functions/showlogs.dart';
import 'package:vending/app/modules/models/listsale_model.dart';
import 'package:vending/app/routes/app_pages.dart';
import 'package:vending/widget/dialog/dialog_ads.dart';
import 'package:vending/widget/dialog/showdialog.dart';
import 'package:video_player/video_player.dart';
import 'dart:math';

import '../../../../services/product_service.dart';
import '../../models/listmachinesale_model.dart';

class HomeController extends GetxController {
  @override
  void onInit() {
    super.onInit();
    // scrollCon.addListener(_onScroll);
    // intiAudio();
    initValueLocal();
    print('${DateTime.now()}');
    _audioPlayer = AudioPlayer();
    // connectWebSocket.getToken();
    connectWebSocket.login('username', 'password');
    // randomAmdPlaySound();
    Get.updateLocale(const Locale('la', 'LA'));
  }

  @override
  void onReady() {
    super.onReady();
  }

  @override
  void onClose() {
    // scrollCon.dispose();
    _audioPlayer?.dispose();
    videoPlayerCon?.dispose();
    super.onClose();
  }

  VideoPlayerController? videoPlayerCon;
  ConnectWebSocket connectWebSocket = Get.put(ConnectWebSocket());
  var isVideoPlay = false.obs;
  var isVideoPlay2 = false.obs;
  var showQr = false.obs;
  var showPayment = false.obs;
  int timeCount = 50;
  final RxString countdownValue = "".obs;
  var adsMode = false.obs;
  var muteRobotSound = false.obs;
  var muteMusic = true.obs;
  RxDouble musicVolume = 1.0.obs;
  var franciseMode = true.obs;
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
  var storage = GetStorage();

  var loading = false.obs;
  var listSale = <ListSaleModel>[].obs;

  var listMachineSale = <ListMachineSaleModel>[].obs;

  var myOrder = <ListMachineSaleModel>[
    ListMachineSaleModel(),
  ].obs;
  Timer? timeRestart;
  Timer? timeOutGenerateQRMmoney;
  Timer? timeOutCountdown;
  AudioPlayer? _audioPlayer;

  checkRestartApp() async {
    if (timeRestart != null && timeRestart!.isActive) {
      await clearTime();
      timeRestart!.cancel();
      print('=====> CANCEL Restart ${DateTime.now()}');
    }

    timeRestart = Timer(
      Duration(seconds: 120),
      () {
        ShowDialog.checkDialog();
        ShowDialog.checkDialog();
        ShowDialog.checkDialog();
        ShowDialog.checkDialogToPop(Routes.MANAGE_STOCK);
        ShowDialog.checkDialogToPop(Routes.SETTING_CONTROL_MENU);
        ShowDialog.checkDialogToPop(Routes.SETTING_MACHINE);

        if (videoPlayerCon != null) {
          videoPlayerCon?.dispose();
        }
        timeRestart!.cancel();
        print('=====> RESTART APP');
        if (adsMode.value) {
          showDialogAds();
        }
        randomAndPlaySound();

        // Get.offAllNamed(Routes.HOME);
      },
    );
  }

  initValueLocal() async {
    try {
      adsMode.value = storage.read(StorageKey.adsMode) ?? adsMode.value;
      muteRobotSound.value =
          storage.read(StorageKey.muteRobotSound) ?? muteRobotSound.value;
      muteMusic.value = storage.read(StorageKey.muteMusic) ?? muteMusic.value;
      musicVolume.value =
          storage.read(StorageKey.musicVolume) ?? musicVolume.value;
      franciseMode.value =
          storage.read(StorageKey.franciseMode) ?? franciseMode.value;
      isTickets.value = storage.read(StorageKey.isTickets) ?? isTickets.value;
      isHowTo.value = storage.read(StorageKey.isHowTo) ?? isHowTo.value;
      isCashOut.value = storage.read(StorageKey.isCashOut) ?? isCashOut.value;
      isCashOutLAABAccount.value =
          storage.read(StorageKey.isCashOutLAABAccount) ??
              isCashOutLAABAccount.value;
      isCashOutLAABEPIN.value =
          storage.read(StorageKey.isCashOutLAABEPIN) ?? isCashOutLAABEPIN.value;
      isCashOutMMoneyAccount.value =
          storage.read(StorageKey.isCashOutMMoneyAccount) ??
              isCashOutMMoneyAccount.value;
      isCashIn.value = storage.read(StorageKey.isCashIn) ?? isCashIn.value;
      isTemperature.value =
          storage.read(StorageKey.isTemperature) ?? isTemperature.value;
      isWhatsapp.value =
          storage.read(StorageKey.isWhatsapp) ?? isWhatsapp.value;
      isIOSandAndroidQRLink.value =
          storage.read(StorageKey.isIOSandAndroidQRLink) ??
              isIOSandAndroidQRLink.value;
      isCashOutVietcomBank.value =
          storage.read(StorageKey.isCashOutVietcomBank) ??
              isCashOutVietcomBank.value;
      isCashOutBOCbank.value =
          storage.read(StorageKey.isCashOutBOCbank) ?? isCashOutBOCbank.value;
      isCashOutBCAbank.value =
          storage.read(StorageKey.isCashOutBCAbank) ?? isCashOutBCAbank.value;
      isCashOutMCBbank.value =
          storage.read(StorageKey.isCashOutMCBbank) ?? isCashOutMCBbank.value;
      isCashOutVietinBank.value =
          storage.read(StorageKey.isCashOutVietinBank) ??
              isCashOutVietinBank.value;
      isCashOutKasikornBank.value =
          storage.read(StorageKey.isCashOutKasikornBank) ??
              isCashOutKasikornBank.value;
      isCashOutDBSbank.value =
          storage.read(StorageKey.isCashOutDBSbank) ?? isCashOutDBSbank.value;
      isCashOutICBCbank.value =
          storage.read(StorageKey.isCashOutICBCbank) ?? isCashOutICBCbank.value;
      isCashOutBangkokBank.value =
          storage.read(StorageKey.isCashOutBangkokBank) ??
              isCashOutBangkokBank.value;
      isCashOutAbank.value =
          storage.read(StorageKey.isCashOutAbank) ?? isCashOutAbank.value;
    } catch (e, stackTrace) {
      ShowLogs().f('initValueLocal error : $e', stackTrace);
    }
  }

  initializeVideo(String videoPath) {
    // isVideoPlay2(false);
    if (videoPlayerCon != null) {
      videoPlayerCon?.dispose();
    }
    videoPlayerCon?.setVolume(double.parse(musicVolume.value.toString()));
    videoPlayerCon?.setLooping(true);
    videoPlayerCon = VideoPlayerController.asset(videoPath)
      ..initialize().then((_) {
        // videoPlayerCon?.play();
      });
  }

  showDialogAds() async {
    initializeVideo('assets/ads/howto1.webm');
    videoPlayerCon?.play();
    isVideoPlay(true);
    isVideoPlay.refresh();
    dialogShowAds();
    bool isCompleted = false;
    videoPlayerCon?.addListener(() async {
      if (videoPlayerCon!.value.position == videoPlayerCon!.value.duration) {
        videoPlayerCon?.removeListener(() {});
        if (isCompleted) {
          await Future.delayed(Duration(seconds: 2));
          ShowLogs().i('VIDEO COMPLETED');
          isVideoPlay(false);
          isVideoPlay.refresh();
          videoPlayerCon?.pause();
          ShowDialog.checkDialog();
          checkRestartApp();
        }
        isCompleted = true;
      }
    });
  }

  checkPriceAndGenerateQR() {
    try {
      double totalPrice = 0;
      for (var i = 0; i < myOrder.length; i++) {
        if (i != 0) {
          // print('DATA : ${myOrder[i].toJson()}');
          // double price = myOrder[i].stock!.price!.toDouble();
          // print('price : $price');
          totalPrice += myOrder[i].stock!.price!.toDouble();
        }
      }
      print('price : $totalPrice');
    } catch (e, stackTrace) {
      ShowLogs().f('checkPriceAndGenerateQR error : $e', stackTrace);
    }
  }

  randomAndPlaySound() async {
    try {
      if (!muteMusic.value) {
        final manifestContent =
            await rootBundle.loadString('AssetManifest.json');
        final Map<String, dynamic> manifestMap = json.decode(manifestContent);
        final audioPaths = manifestMap.keys
            .where((key) =>
                key.startsWith('assets/audios/lao-voices/') &&
                key.endsWith('.mp3'))
            .toList();

        final randomIndex = Random().nextInt(audioPaths.length);
        final selectedSong = audioPaths[randomIndex];
        _audioPlayer?.setVolume(double.parse(musicVolume.value.toString()));
        await _audioPlayer?.setAsset(selectedSong);
        await _audioPlayer?.play();
        _audioPlayer?.playerStateStream.listen((playerState) async {
          if (playerState.processingState == ProcessingState.completed) {
            Future.delayed(Duration(seconds: 15), () {
              // print('Audio completed');
              randomAndPlaySound();
            });
          }
        });
      }
    } catch (e, stackTrace) {
      ShowLogs().f('randomAmdPlaySound error : $e', stackTrace);
    }
  }

  intiAudio() async {
    try {
      final manifestContent = await rootBundle.loadString('AssetManifest.json');
      final Map<String, dynamic> manifestMap = json.decode(manifestContent);

      final audioPaths = manifestMap.keys
          .where((key) =>
              key.startsWith('assets/audios/lao-voices/') &&
              key.endsWith('.mp3'))
          .toList();
      final playlist = ConcatenatingAudioSource(
        children: audioPaths.map((file) => AudioSource.asset(file)).toList(),
      );
      // ShowLogs().i('playlist : ${playlist}');
      _audioPlayer = AudioPlayer();
      _audioPlayer?.setAudioSource(playlist);
      _audioPlayer?.playerStateStream.listen((playerState) async {
        if (playerState.processingState == ProcessingState.completed) {
          Future.delayed(Duration(seconds: 5));

          if (_audioPlayer!.hasNext) {
            await _audioPlayer?.seekToNext(); // ไปเพลงถัดไป
            await _audioPlayer?.play(); // เล่นเพลงถัดไป
          }
        }
      });
      // _audioPlayer.play();

      // _audioPlayer.setLoopMode(LoopMode.one);
      // _audioPlayer.play();
    } catch (e, stackTrace) {
      ShowLogs().f('ERROR INIT AUDIO', stackTrace);
    }
  }

  clearTime() {
    if (timeOutGenerateQRMmoney != null && timeOutGenerateQRMmoney!.isActive) {
      timeOutGenerateQRMmoney!.cancel();
      // ShowLogs().i('CANCEL TIMER');
    }
    if (timeOutCountdown != null && timeOutCountdown!.isActive) {
      timeOutCountdown!.cancel();
    }

    myOrder = [ListMachineSaleModel()].obs;
  }

  initTimeGenerateQRMmoney() async {
    try {
      showQr(false);
      showPayment(true);

      if (timeOutGenerateQRMmoney != null &&
          timeOutGenerateQRMmoney!.isActive) {
        timeOutGenerateQRMmoney!.cancel();
        ShowLogs().i('CANCEL TIMER');
      }
      if (timeOutCountdown != null && timeOutCountdown!.isActive) {
        timeOutCountdown!.cancel();
      }
      countdownValue.value = "${timeCount}";

      await generateGrMmoney();
      print("--------start--------");
      countdownTimeout();
      timeOutGenerateQRMmoney = Timer(
        Duration(seconds: timeCount),
        () {
          print("-----stop-----");

          timeOutGenerateQRMmoney!.cancel();
          timeOutCountdown!.cancel();
          myOrder = [ListMachineSaleModel()].obs;

          showQr(false);
          showQr.refresh();
          ShowDialog.checkDialog();
        },
      );
    } catch (e, stackTrace) {
      ShowLogs().f("initTimeGenerateQRMmoney : $e", stackTrace);
    }
  }

  generateGrMmoney() async {
    showQr(false);
    if (myOrder.length > 1) {
      await Future.delayed(const Duration(seconds: 1), () {
        showQr(true);
        showQr.refresh();
      });
    }
  }

  countdownTimeout() {
    if (timeOutCountdown != null) {
      timeOutCountdown!.cancel();
    }
    int countdown = timeCount;
    timeOutCountdown = Timer.periodic(const Duration(seconds: 1), (timer) {
      countdown--;
      countdownValue.value = countdown >= timeCount
          ? "${countdown ~/ timeCount}:${countdown % timeCount}"
          : "${countdown}";
      countdownValue.refresh();
      ShowLogs().i('countdown : ${countdownValue.value}');
    });
  }

  addOrder(ListMachineSaleModel value) async {
    myOrder.add(value);
    await checkPriceAndGenerateQR();
    myOrder.refresh();
  }

  loadSaleList() async {
    try {
      loading(true);
      var token = connectWebSocket.getToken();
      var body = {
        "command": Ecommand.list,
        "data": {"clientId": storage.read(StorageKey.clientId)},
        "time": DateTime.now().toIso8601String(),
        "token": token
      };
      var response = await ProductHttp.loadSaleList(body);
      if (checkResponse(response)) {
        var data = jsonDecode(response.body)['data'];
        // print('data : $data');
        listSale.clear();
        listSale.addAll(data
            .map<ListSaleModel>((json) => ListSaleModel.fromJson(json))
            .toList());
        // print('listSale : $listSale');
        loading(false);
        update();
      } else {
        ShowLogs().i('loadSaleList : ${response.body}');
      }
    } catch (e, stackTrace) {
      ShowLogs().f('loadSaleList : $e', stackTrace);
    }
  }

  loadMachineSale() async {
    try {
      loading(true);
      var token = connectWebSocket.getToken();
      var body = {"token": token};
      var response = await ProductHttp.loadMachineSale(body);
      if (checkResponse(response)) {
        var data = jsonDecode(response.body)['data'];
        // print('data : $data');
        listMachineSale.clear();
        listMachineSale.addAll(data
            .map<ListMachineSaleModel>(
                (json) => ListMachineSaleModel.fromJson(json))
            .toList());
        listMachineSale.value = listMachineSale
            .where((element) => element.stock!.qtty != 0)
            .toList();
        // print('listSale : $listSale');
        loading(false);
        update();
      } else {
        ShowLogs().i('loadMachineSale : ${response.body}');
      }
    } catch (e, stackTrace) {
      ShowLogs().f('loadMachineSale : $e', stackTrace);
    }
  }
}
