import 'dart:async';
import 'dart:convert';
import 'package:crypto/crypto.dart';
import 'package:get/get.dart';
import 'package:get_storage/get_storage.dart';
import 'package:vending/app/data/ecommand.dart';
import 'package:vending/app/data/storage_key.dart';
import 'package:vending/app/functions/showlogs.dart';
import 'package:vending/app/modules/home/controllers/home_controller.dart';
import 'package:web_socket_channel/web_socket_channel.dart';

class ConnectWebSocket extends GetxController {
  var loading = false.obs;
  late Timer timeOut;
  Timer? timeOutCheckSocket;
  Timer? timeOutPing;
  late WebSocketChannel channel;
  int countClick = 0;
  RxDouble balance = 0.0.obs;

  final _storage = GetStorage();
  getToken() {
    var bytes = utf8.encode(
        '${_storage.read(StorageKey.machineId)}${_storage.read(StorageKey.otp)}');
    var digest = sha256.convert(bytes);
    print('=====> digest is :${digest}');
    return digest.toString();
  }

  checkLostSocket() {
    if (timeOutCheckSocket != null && timeOutCheckSocket!.isActive) {
      timeOutCheckSocket!.cancel();
      // print('=====> CANCEL CHECK SOCKET ${DateTime.now()}');
    }

    // timeOutCheckSocket = Timer(
    //   const Duration(seconds: 15),
    //   () {
    //     timeOutCheckSocket!.cancel();
    //     if (timeOutPing != null && timeOutPing!.isActive) {
    //       timeOutPing!.cancel();
    //     }
    //     login('username', 'password');
    //   },
    // );
    timeOutCheckSocket = Timer.periodic(const Duration(seconds: 15), (timer) {
      // timeOutCheckSocket!.cancel();
      if (timeOutPing != null && timeOutPing!.isActive) {
        timeOutPing!.cancel();
      }
      login('username', 'password');
    });
  }

  login(String username, String password) {
    try {
      print('=====> login');
      loading(true);
      channel = WebSocketChannel.connect(
        Uri.parse(
            _storage.read(StorageKey.wsUrl) ?? 'ws://laoapps.com:9006/zdm8'),
      );
      channel.stream.listen(
          (event) {
            dynamic data = jsonDecode(event);
            if (data['command'] == Ecommand.login) {
              String? clientId = data['data']['data']['clientId'];
              if (clientId != null) {
                _storage.write(StorageKey.clientId, clientId);
                HomeController homeCon = Get.find<HomeController>();
                homeCon.loadMachineSale();
                // HomeController().loadSaleList();
              }
            }
            if (data['command'] == Ecommand.ping) {
              // balance.value = double.parse(data['data']['balance'].toString());
              balance.value = balance.value + 9999;
              // print('=====> balance is :${balance.value}');
              balance.refresh();
            }
            checkLostSocket();
            ShowLogs().i('=====> data is :${event}');
          },
          onDone: () {},
          onError: (error) {
            print("Error connect webSocket is : ${error}");
          });
      String digest = getToken();
      var data = {"command": Ecommand.login, "token": digest.toString()};
      channel.sink.add(utf8.encode(jsonEncode(data)));
      channel.sink.add(utf8.encode(jsonEncode({"command": Ecommand.ping})));
      pingFunction();
    } catch (e, stackTrace) {
      ShowLogs().f('error login websocker is :${e}', stackTrace);
    }
  }

  pingFunction() {
    // int index = 0;
    timeOutPing = Timer.periodic(const Duration(seconds: 10), (timer) {
      var data = {"command": Ecommand.ping};
      countClick = 0;
      // print("data is : ${data}");
      // index++;

      channel.sink.add(utf8.encode(jsonEncode(data)));
      // print("PING");
    });
    loading(false);
    update();
  }
}
