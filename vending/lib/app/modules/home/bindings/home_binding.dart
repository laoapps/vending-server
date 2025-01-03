import 'package:get/get.dart';
import 'package:vending/app/controllers/connectwebsocket.dart';
import '../controllers/home_controller.dart';

class HomeBinding extends Bindings {
  @override
  void dependencies() {
    Get.lazyPut<HomeController>(
      () => HomeController(),
    );
    Get.lazyPut<ConnectWebSocket>(
      () => ConnectWebSocket(),
    );
  }
}
