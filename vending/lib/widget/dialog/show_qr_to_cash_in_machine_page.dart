import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:vending/app/data/languages_key.dart';

import '../../app/color/main_color.dart';
import '../../app/config/config.dart';
import '../../app/controllers/cash_in_controller.dart';
import '../../app/functions/format.dart';

void showQRtoCashInMachinePage(int amount, var qrCode) {
  double deviceHeight = Get.mediaQuery.size.height;
  double deviceWidth = Get.mediaQuery.size.width;
  CashInController cashInCon = Get.put(CashInController());

  Get.generalDialog(
    pageBuilder: (context, animation, secondaryAnimation) {
      return Center(
        child: Stack(
          alignment: Alignment.topRight,
          children: [
            Obx(() {
              return Material(
                child: Container(
                  width: deviceWidth * 0.6,
                  height: deviceHeight * 0.45,
                  color: ColorData.mainColor,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Center(
                        child: Text(
                          "${Format.priceFormat(amount.toDouble())} ${Lang.kip.tr}",
                          style: TextStyle(
                              fontFamily: font,
                              fontSize:
                                  MediaQuery.of(context).size.width * 0.03,
                              color: ColorData.mainBorder),
                        ),
                      ),
                      SizedBox(
                        height: MediaQuery.of(context).size.height * 0.005,
                      ),
                      Expanded(
                        child: Column(
                          children: [
                            Padding(
                              padding: const EdgeInsets.all(8.0),
                              child: Center(
                                child: Container(
                                  color: Colors.white,
                                  child: QrImageView(
                                    data: qrCode.toString(),
                                  ),
                                ),
                              ),
                            ),
                            Text(
                              "${Lang.qrTimeOut.tr} :${cashInCon.countdownValue} ${Lang.seconds.tr}",
                              style: TextStyle(
                                  fontFamily: font,
                                  color: Colors.white,
                                  fontSize: deviceWidth * 0.025),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              );
            }),
            Padding(
              padding: const EdgeInsets.only(top: 4),
              child: SizedBox(
                // color: Colors.orange,
                width: MediaQuery.of(context).size.width * 0.08,
                child: GestureDetector(
                  onTap: () {
                    cashInCon.cancleTime();
                    Get.back();
                  },
                  child: Icon(
                    Icons.clear,
                    color: Colors.white,
                    size: deviceHeight * 0.03,
                  ),
                ),
              ),
            )
          ],
        ),
      );
    },
  );
}
