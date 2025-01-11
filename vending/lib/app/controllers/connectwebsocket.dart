import 'dart:async';
import 'dart:convert';
import 'dart:isolate';
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

  // Function to get the token
  getToken() async {
    var receivePort = ReceivePort(); // สำหรับรับผลลัพธ์จาก isolate
    await Isolate.spawn(computeSha256, receivePort.sendPort);

    // รอรับ SendPort จาก isolate
    var sendPort = await receivePort.first as SendPort;

    // รับผลลัพธ์จาก isolate
    var responsePort = ReceivePort();
    sendPort.send([
      // _storage.read(StorageKey.machineId) + _storage.read(StorageKey.otp),
      '22222222111111',
      responsePort.sendPort
    ]);

    // รอผลลัพธ์การคำนวณ
    var result = await responsePort.first as String;
    return result;
  }

  // Isolate function for computing SHA256 hash
  static void computeSha256(SendPort sendPort) {
    var receivePort = ReceivePort();
    sendPort.send(receivePort.sendPort);

    receivePort.listen((message) {
      var data = message[0]; // ข้อมูลจาก main isolate
      var replyTo = message[1]; // SendPort สำหรับส่งผลลัพธ์กลับ

      // คำนวณ sha256
      var bytes = utf8.encode(data);
      var digest = sha256.convert(bytes);

      // ส่งผลลัพธ์กลับ
      replyTo.send(digest.toString());
    });
  }

  // Checking lost socket connection
  checkLostSocket() {
    if (timeOutCheckSocket != null && timeOutCheckSocket!.isActive) {
      timeOutCheckSocket!.cancel();
    }

    timeOutCheckSocket = Timer.periodic(const Duration(seconds: 15), (timer) {
      if (timeOutPing != null && timeOutPing!.isActive) {
        timeOutPing!.cancel();
      }
      login('username', 'password');
    });
  }

  // Login function to connect to WebSocket
  login(String username, String password) async {
    try {
      print('=====> login');
      loading(true);
      channel = WebSocketChannel.connect(
        Uri.parse(
            _storage.read(StorageKey.wsUrl) ?? 'ws://laoapps.com:9006/zdm8'),
      );

      channel.stream.listen(
        (event) {
          handleWebSocketEvent(event);
        },
        onDone: handleWebSocketDone,
        onError: handleWebSocketError,
      );

      String digest = await getToken();
      var data = {"command": Ecommand.login, "token": digest.toString()};
      channel.sink.add(utf8.encode(jsonEncode(data)));
      channel.sink.add(utf8.encode(jsonEncode({"command": Ecommand.ping})));
      HomeController homeCon = Get.find<HomeController>();
      homeCon.loadMachineSale();
      pingFunction();
    } catch (e, stackTrace) {
      ShowLogs().f('error login websocket is :${e}', stackTrace);
      reconnectWebSocket();
    }
  }

  // Handle WebSocket events
  handleWebSocketEvent(String event) {
    dynamic data = jsonDecode(event);
    if (data['command'] == Ecommand.login) {
      String? clientId = data['data']['data']['clientId'];
      if (clientId != null) {
        _storage.write(StorageKey.clientId, clientId);
      }
    }
    if (data['command'] == Ecommand.ping) {
      balance.value = balance.value + 9999;
      balance.refresh();
    }
    checkLostSocket();
    ShowLogs().i('=====> data is :${event}');
  }

  // Handle WebSocket errors
  handleWebSocketError(dynamic error) {
    print("WebSocket error: $error");
    reconnectWebSocket(); // Reconnect if error occurs
  }

  // Handle WebSocket done (closed connection)
  handleWebSocketDone() {
    print("WebSocket closed");
    reconnectWebSocket(); // Reconnect when done (closed connection)
  }

  // Reconnect WebSocket if needed
  reconnectWebSocket() {
    timeOutCheckSocket?.cancel();
    timeOutCheckSocket = Timer(const Duration(seconds: 5), () {
      login('username', 'password'); // Reconnect by calling login again
    });
  }

  // Periodic ping function
  pingFunction() {
    timeOutPing = Timer.periodic(const Duration(seconds: 10), (timer) {
      var data = {"command": Ecommand.ping};
      channel.sink.add(utf8.encode(jsonEncode(data)));
    });
    loading(false);
    update();
  }
}
