import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:vending/app/color/main_color.dart';
import 'package:vending/app/data/languages_key.dart';
import 'package:vending/app/functions/format.dart';
import 'package:vending/app/functions/showlogs.dart';
import 'package:vending/app/modules/home/controllers/home_controller.dart';
import 'package:vending/widget/imagecached.dart';
import 'package:vending/widget/screens/screen_widget.dart';
import '../../app/config/config.dart';

void dialogMyOrder() {
  double deviceHeight = Get.mediaQuery.size.height;
  double deviceWidth = Get.mediaQuery.size.width;
  HomeController controller = Get.put(HomeController());
  Get.generalDialog(
    pageBuilder: (context, animation, secondaryAnimation) {
      return ScreenWidget(
        onClick: () {
          ShowLogs().i('CLOSE MY ORDER');
          Get.back();
          controller.clearTime();
        },
        width: deviceWidth * 0.9,
        height: deviceHeight * 0.9,
        title: Lang.myOrder.tr,
        child: Obx(() {
          return Stack(
            alignment: Alignment.bottomCenter,
            children: [
              Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(colors: [
                    Colors.red,
                    Colors.redAccent.shade200,
                    Colors.red
                  ]),
                ),
                child: GridView.builder(
                  padding: EdgeInsets.all(5),
                  itemCount: controller.myOrder.length,
                  gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisSpacing: 5,
                    mainAxisSpacing: 5,
                    crossAxisCount: 3,
                    childAspectRatio: 3 / 4,
                  ),
                  itemBuilder: (context, index) {
                    var data = controller.myOrder[index];
                    return index == 0
                        ? InkWell(
                            onTap: () {
                              // if (controller.timeOutGenerateQRMmoney != null &&
                              //     controller.timeOutGenerateQRMmoney != null &&
                              //     controller
                              //         .timeOutGenerateQRMmoney!.isActive &&
                              //     controller.timeOutCountdown!.isActive) {
                              //   Get.back();
                              // }
                            },
                            child: Container(
                              decoration: BoxDecoration(
                                border: Border.all(color: ColorData.mainBorder),
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: Center(
                                child: Icon(
                                  Icons.add,
                                  color: ColorData.mainBorder,
                                  size: deviceHeight * 0.04,
                                ),
                              ),
                            ),
                          )
                        : Container(
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(10),
                              color: ColorData.mainBorder,
                            ),
                            child: Column(
                              children: [
                                Row(
                                  children: [
                                    Container(
                                      decoration: BoxDecoration(
                                        color: Colors.blue,
                                        borderRadius: BorderRadius.circular(5),
                                      ),
                                      padding: EdgeInsets.all(3),
                                      child: Text(
                                        '${data.position}#',
                                        style: TextStyle(
                                          fontFamily: font,
                                          color: Colors.white,
                                          fontWeight: FontWeight.bold,
                                          fontSize: deviceHeight * 0.015,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                                Expanded(
                                  child: CachedNetworkImageWidget(
                                      imageUrl:
                                          IMAGE + data.stock!.image.toString()),
                                ),
                                Text(
                                  '${data.stock!.name}',
                                  style: TextStyle(
                                      fontFamily: font,
                                      fontSize: deviceHeight * 0.015),
                                ),
                                Text(
                                  '${Lang.price.tr}: ${Format.priceFormat(data.stock!.price!.toDouble())} ${Lang.kip.tr}',
                                  style: TextStyle(
                                      fontFamily: font,
                                      fontSize: deviceHeight * 0.015),
                                ),
                                Divider(),
                                InkWell(
                                  onTap: () async {
                                    // if (controller.timeOutGenerateQRMmoney != null &&
                                    //     controller.timeOutGenerateQRMmoney !=
                                    //         null &&
                                    //     controller.timeOutGenerateQRMmoney!
                                    //         .isActive &&
                                    //     controller.timeOutCountdown!.isActive) {
                                    //   controller.myOrder.removeAt(index);
                                    //   controller.checkPriceAndGenerateQR();
                                    //   controller.myOrder.refresh();
                                    //   controller.initTimeGenerateQRMmoney();
                                    // }
                                  },
                                  child: Icon(
                                    Icons.delete,
                                    color: Colors.red,
                                    size: deviceHeight * 0.025,
                                  ),
                                )
                              ],
                            ),
                          );
                  },
                ),
              ),
              if (controller.showQr.value)
                Stack(
                  clipBehavior: Clip.none,
                  children: [
                    if (controller.showPayment.value)
                      Container(
                        height: deviceHeight * 0.35,
                        padding: EdgeInsets.all(15),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.only(
                            topLeft: Radius.circular(10),
                            topRight: Radius.circular(10),
                          ),
                        ),
                        child: Center(
                          child: Row(
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  mainAxisAlignment: MainAxisAlignment.start,
                                  children: [
                                    Text(
                                      'PAYMENT OPTIONS',
                                      style: TextStyle(
                                        fontFamily: font,
                                        fontWeight: FontWeight.bold,
                                        fontSize: deviceHeight * 0.02,
                                      ),
                                    ),
                                    GridView.builder(
                                      itemCount: 1,
                                      shrinkWrap: true,
                                      padding: EdgeInsets.zero,
                                      gridDelegate:
                                          const SliverGridDelegateWithFixedCrossAxisCount(
                                        crossAxisCount: 3,
                                        crossAxisSpacing: 1,
                                        mainAxisSpacing: 1,
                                      ),
                                      itemBuilder: (context, index) {
                                        return Column(
                                          children: [
                                            Builder(builder: (context) {
                                              return Builder(
                                                  builder: (context) {
                                                return Image.asset(
                                                    height: deviceHeight * 0.06,
                                                    "assets/images/mmoney-logo.png");
                                              });
                                            }),
                                            Text(
                                              'MMoney',
                                              style: TextStyle(
                                                  fontFamily: font,
                                                  fontSize:
                                                      deviceHeight * 0.015,
                                                  color: Colors.grey),
                                            ),
                                          ],
                                        );
                                      },
                                    ),
                                    Divider(),
                                  ],
                                ),
                              ),
                              Expanded(
                                child: Container(
                                  padding: EdgeInsets.all(5),
                                  decoration: BoxDecoration(
                                      gradient: LinearGradient(colors: [
                                        Colors.red,
                                        Colors.redAccent.shade200,
                                        Colors.red
                                      ]),
                                      borderRadius: BorderRadius.circular(5)),
                                  child: Column(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      QrImageView(
                                        size: deviceHeight * 0.18,
                                        data: "sfds",
                                        backgroundColor: Colors.white,
                                      ),
                                      SizedBox(
                                        height: deviceHeight * 0.01,
                                      ),
                                      Text(
                                        "10,000",
                                        style: TextStyle(
                                          fontWeight: FontWeight.bold,
                                          fontFamily: font,
                                          color: ColorData.txtColor,
                                          fontSize: deviceHeight * 0.025,
                                        ),
                                      ),
                                      Divider(),
                                      Row(
                                        mainAxisAlignment:
                                            MainAxisAlignment.spaceBetween,
                                        children: [
                                          Text(
                                            'SubQTTY',
                                            style: TextStyle(
                                                fontFamily: font,
                                                fontSize: deviceHeight * 0.018,
                                                color: ColorData.txtColor),
                                          ),
                                          Text(
                                            '1',
                                            style: TextStyle(
                                                fontFamily: font,
                                                fontSize: deviceHeight * 0.018,
                                                color: ColorData.txtColor),
                                          ),
                                        ],
                                      )
                                    ],
                                  ),
                                ),
                              )
                            ],
                          ),
                        ),
                      ),
                    controller.showPayment.value
                        ? Positioned(
                            top: -deviceHeight * 0.0225,
                            left: deviceHeight * 0.25,
                            child: GestureDetector(
                              onTap: () {
                                controller.showPayment.value = false;
                                controller.showPayment.refresh();
                              },
                              child: Container(
                                height: deviceHeight * 0.045,
                                width: deviceHeight * 0.045,
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  shape: BoxShape.circle,
                                ),
                                child: Icon(
                                  Icons.keyboard_arrow_down_sharp,
                                  color: Colors.grey,
                                  size: deviceHeight * 0.04,
                                ),
                              ),
                            ),
                          )
                        : Positioned(
                            bottom: -10,
                            left: deviceHeight * 0.25,
                            child: GestureDetector(
                              onTap: () {
                                controller.showPayment.value = true;
                                controller.showPayment.refresh();
                              },
                              child: Container(
                                height: deviceHeight * 0.045,
                                width: deviceHeight * 0.045,
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  shape: BoxShape.circle,
                                ),
                                child: Icon(
                                  Icons.keyboard_arrow_up_outlined,
                                  color: Colors.grey,
                                  size: deviceHeight * 0.04,
                                ),
                              ),
                            ),
                          ),
                  ],
                )
            ],
          );
        }),
      );
    },
  );
}
