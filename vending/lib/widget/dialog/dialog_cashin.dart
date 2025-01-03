import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:vending/app/color/main_color.dart';
import 'package:vending/app/data/languages_key.dart';
import 'package:vending/app/functions/showlogs.dart';
import 'package:vending/widget/dialog/show_qr_to_cash_in_machine_page.dart';
import 'package:vending/widget/screens/screen_widget.dart';

import '../../app/config/config.dart';
import '../../app/controllers/cash_in_controller.dart';

void dialogCashIn() {
  double deviceHeight = Get.mediaQuery.size.height;
  double deviceWidth = Get.mediaQuery.size.width;
  List<int> items = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
  // int? selectBalance;
  // HomeController homeCon = Get.find<HomeController>();
  CashInController cashInCon = Get.put(CashInController());

  Get.generalDialog(
    pageBuilder: (context, animation, secondaryAnimation) {
      return ScreenWidget(
        width: deviceWidth * 0.6,
        height: deviceHeight * 0.35,
        title: Lang.cashIn.tr,
        child: Container(
          color: ColorData.mainBorder,
          child: GridView.builder(
            itemCount: items.length,
            padding: EdgeInsets.all(10),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2, // number of items in each row
                mainAxisSpacing: 10.0, // spacing between rows
                crossAxisSpacing: 10.0, // spacing between columns
                childAspectRatio: 4),
            itemBuilder: (context, index) {
              var data = items[index];
              return GestureDetector(
                onTap: () {
                  Get.back();
                  cashInCon.initTimePayment();
                  var qrCode = {
                    "type": 'CQR',
                    "mode": 'COIN',
                    "destination": 'wrdwsd',
                    "amount": data,
                    "expire": "",
                    "options": {
                      "coinname": 'dssd',
                      "name": 'adsd',
                    }
                  };
                  ShowLogs().i(qrCode.toString());
                  showQRtoCashInMachinePage(data, qrCode);
                },
                child: Container(
                  decoration: BoxDecoration(
                      color: ColorData.mainColor,
                      // border: Border.all(color: ColorData.mainColor),
                      borderRadius: BorderRadius.circular(100)),
                  child: Center(
                      child: Text(
                    "${data}",
                    style: TextStyle(
                        fontFamily: font,
                        color: Colors.white,
                        fontSize: deviceWidth * 0.025),
                  )),
                ),
              );
            },
          ),
        ),
      );
    },
  );
}
