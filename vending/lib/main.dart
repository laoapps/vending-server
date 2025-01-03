import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:get_storage/get_storage.dart';
import 'package:vending/app/controllers/cash_in_controller.dart';
import 'package:vending/app/data/localizations.dart';
import 'app/routes/app_pages.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  Get.lazyPut(() => CashInController());

  await GetStorage.init();
  runApp(
    GetMaterialApp(
      title: "Application",
      initialRoute: AppPages.INITIAL,
      translations: Languages(),
      locale: Get.deviceLocale,
      fallbackLocale: const Locale('la', 'LA'),
      debugShowCheckedModeBanner: false,
      getPages: AppPages.routes,
    ),
  );
}
