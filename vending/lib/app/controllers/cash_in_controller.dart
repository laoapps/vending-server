import 'dart:async';
// import 'dart:convert';
import 'package:get/get.dart';
// import 'package:http/http.dart' as http;

class CashInController extends GetxController {
  late Timer timeOut;
  late Timer timeOutCountdown;
  late Timer timeOutWallet;
  int count = 15;
  final RxString countdownValue = "".obs;
  double money = 0;
  // ConnectWebSocket connectWebSocket = Get.find<ConnectWebSocket>();

  initTimePayment() {
    countdownTimeout();
    // checkWalletTimeout();
    print("--------start--------");
    timeOut = Timer(Duration(seconds: count), () {
      print("-----stop-----");
      timeOut.cancel();
      timeOutCountdown.cancel();
      // timeOutWallet.cancel();
      countdownValue.value = "${count}";
      Get.back();
    });
  }

  cancleTime() {
    timeOut.cancel();
    timeOutCountdown.cancel();
    // timeOutWallet.cancel();
  }

  // checkWalletTimeout() {
  //   try {
  //     money = double.parse(
  //         jsonDecode(connectWebSocket.dataListen.toString())['data']['balance']
  //             .toString());
  //     timeOutWallet = Timer.periodic(const Duration(seconds: 5), (timer) async {
  //       var url = Uri.parse(
  //           "${END_POINTS_WALLET}/laab/client/show_vending_wallet_coin_balance");
  //       var body = {"token": connectWebSocket.getToken()};
  //       var response = await http.post(url, body: json.encode(body), headers: {
  //         "Content-Type": "application/json",
  //       });
  //       print("Response check wallets is :${response.body}");
  //       if (checkResponse(response)) {
  //         var data = jsonDecode(response.body)['info']['balance'];
  //         if (money != double.parse(data.toString())) {
  //           money = double.parse(data.toString());
  //           print("Success");
  //           Get.back();
  //           cancleTime();
  //           connectWebSocket.pingCheckWallet();
  //           ShowToast.showSuccess("ການເຕີມເງິນສຳເຫຼັດ");
  //         } else {
  //           money = double.parse(data.toString());
  //           print("NON");
  //         }
  //       } else {
  //         Get.back();
  //         cancleTime();
  //         ShowDialog.showFaild();
  //       }
  //     });
  //   } catch (e) {
  //     Get.back();
  //     cancleTime();
  //     ShowDialog.showFaild();
  //     print("Error checkWallet is : ${e}");
  //   }
  // }

  countdownTimeout() {
    int countdown = count;
    timeOutCountdown = Timer.periodic(const Duration(seconds: 1), (timer) {
      countdown--;
      countdownValue.value = countdown >= count
          ? "${countdown ~/ count}:${countdown % count}"
          : "${countdown}";
      update();
    });
  }
}
