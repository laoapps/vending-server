import 'package:get/get.dart';

import '../controllers/manage_stock_controller.dart';

class ManageStockBinding extends Bindings {
  @override
  void dependencies() {
    Get.lazyPut<ManageStockController>(
      () => ManageStockController(),
    );
  }
}
