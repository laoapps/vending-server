import 'package:flutter/material.dart';

import 'package:get/get.dart';
import 'package:get_storage/get_storage.dart';
import 'package:vending/app/color/main_color.dart';
import 'package:vending/app/config/config.dart';
import 'package:vending/app/data/storage_key.dart';
import 'package:vending/widget/switchtext_widget.dart';

import '../controllers/setting_control_menu_controller.dart';

class SettingControlMenuView extends GetView<SettingControlMenuController> {
  const SettingControlMenuView({super.key});
  @override
  Widget build(BuildContext context) {
    double deviceHeight = MediaQuery.of(context).size.height;
    var storage = GetStorage();
    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          onPressed: () {
            Get.back();
          },
          icon: Icon(
            Icons.arrow_back,
            color: ColorData.txtColor,
            size: deviceHeight * 0.022,
          ),
        ),
        backgroundColor: ColorData.mainColor,
        title: Text(
          'Setting - Control Menu',
          style: TextStyle(
              fontFamily: font,
              color: ColorData.txtColor,
              fontSize: deviceHeight * 0.018),
        ),
        centerTitle: true,
        // actions: [
        //   TextButton(
        //     onPressed: () {
        //       print('save');
        //     },
        //     child: Row(
        //       children: [
        //         Icon(
        //           Icons.save,
        //           color: ColorData.txtColor,
        //           size: deviceHeight * 0.02,
        //         ),
        //         Text(
        //           'Save',
        //           style: TextStyle(
        //               fontFamily: font,
        //               fontSize: deviceHeight * 0.015,
        //               color: ColorData.txtColor),
        //         ),
        //       ],
        //     ),
        //   ),
        // ],
      ),
      body: Obx(() {
        return SingleChildScrollView(
          child: Padding(
            padding: const EdgeInsets.all(15.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Vending Standard',
                  style: TextStyle(
                    fontFamily: font,
                    fontSize: deviceHeight * 0.015,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Card(
                  elevation: 10,
                  child: Padding(
                    padding: const EdgeInsets.all(15.0),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              SwitchText(
                                value: controller.isTickets.value,
                                text: "Tickets",
                                onChanged: (p0) {
                                  controller.isTickets.value = p0;
                                  storage.write(StorageKey.isTickets, p0);
                                },
                              ),
                              SizedBox(
                                height: deviceHeight * 0.01,
                              ),
                              SwitchText(
                                value: controller.isHowTo.value,
                                text: "How to",
                                onChanged: (p0) {
                                  controller.isHowTo.value = p0;
                                  storage.write(StorageKey.isHowTo, p0);
                                },
                              ),
                            ],
                          ),
                        ),
                        Expanded(
                          child: Column(
                            children: [
                              SwitchText(
                                value: controller.isCashOut.value,
                                text: "Cash Out",
                                onChanged: (p0) {
                                  controller.isCashOut.value = p0;
                                  storage.write(StorageKey.isCashOut, p0);
                                },
                              ),
                              SizedBox(
                                height: deviceHeight * 0.01,
                              ),
                              SwitchText(
                                value: controller.isTemperature.value,
                                text: "Temperature",
                                onChanged: (p0) {
                                  controller.isTemperature.value = p0;
                                  storage.write(StorageKey.isTemperature, p0);
                                },
                              )
                            ],
                          ),
                        ),
                        Expanded(
                          child: Column(
                            children: [
                              SwitchText(
                                value: controller.isWhatsapp.value,
                                text: "Whatsapp",
                                onChanged: (p0) {
                                  controller.isWhatsapp.value = p0;
                                  storage.write(StorageKey.isWhatsapp, p0);
                                },
                              )
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                Text(
                  'LAAB Menu',
                  style: TextStyle(
                    fontFamily: font,
                    fontSize: deviceHeight * 0.015,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Card(
                  elevation: 10,
                  child: Padding(
                    padding: const EdgeInsets.all(15.0),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: Column(
                            children: [
                              SwitchText(
                                value: controller.isCashIn.value,
                                text: "Cash In",
                                onChanged: (p0) {
                                  controller.isCashIn.value = p0;
                                  storage.write(StorageKey.isCashIn, p0);
                                },
                              ),
                            ],
                          ),
                        ),
                        Expanded(
                          child: Column(
                            children: [
                              SwitchText(
                                value: controller.isCashOutLAABAccount.value,
                                text: "Cash Out - LAAB",
                                onChanged: (p0) {
                                  controller.isCashOutLAABAccount.value = p0;
                                  storage.write(
                                      StorageKey.isCashOutLAABAccount, p0);
                                },
                              ),
                            ],
                          ),
                        ),
                        Expanded(
                          child: Column(
                            children: [
                              SwitchText(
                                value: controller.isCashOutLAABEPIN.value,
                                text: "Cash Out - LAAB EPIN",
                                onChanged: (p0) {
                                  controller.isCashOutLAABEPIN.value = p0;
                                  storage.write(
                                      StorageKey.isCashOutLAABEPIN, p0);
                                },
                              )
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                Text(
                  'MMoney Menu',
                  style: TextStyle(
                    fontFamily: font,
                    fontSize: deviceHeight * 0.015,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Card(
                  elevation: 10,
                  child: Padding(
                    padding: const EdgeInsets.all(15.0),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: Column(
                            children: [
                              SwitchText(
                                value: controller.isCashOutMMoneyAccount.value,
                                text: "Cash Out MMoney",
                                onChanged: (p0) {
                                  controller.isCashOutMMoneyAccount.value = p0;
                                  storage.write(
                                      StorageKey.isCashOutMMoneyAccount, p0);
                                },
                              )
                            ],
                          ),
                        ),
                        Expanded(
                          child: Column(
                            children: [
                              SwitchText(
                                value: controller.isIOSandAndroidQRLink.value,
                                text: "IOS & Android QR Link",
                                onChanged: (p0) {
                                  controller.isIOSandAndroidQRLink.value = p0;
                                  storage.write(
                                      StorageKey.isIOSandAndroidQRLink, p0);
                                },
                              )
                            ],
                          ),
                        ),
                        Expanded(
                          child: Column(
                            children: [],
                          ),
                        )
                      ],
                    ),
                  ),
                ),
                Text(
                  'Bank Cash Out Menu',
                  style: TextStyle(
                    fontFamily: font,
                    fontSize: deviceHeight * 0.015,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Card(
                  elevation: 10,
                  child: Padding(
                    padding: EdgeInsets.all(15),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: Column(
                            children: [
                              SwitchText(
                                value: controller.isCashOutVietcomBank.value,
                                text: "Cash Out - Vietcome",
                                onChanged: (p0) {
                                  controller.isCashOutVietcomBank.value = p0;
                                  storage.write(
                                      StorageKey.isCashOutVietcomBank, p0);
                                },
                              ),
                              SizedBox(
                                height: deviceHeight * 0.01,
                              ),
                              SwitchText(
                                value: controller.isCashOutBOCbank.value,
                                text: "Cash Out - BOC Bank",
                                onChanged: (p0) {
                                  controller.isCashOutBOCbank.value = p0;
                                  storage.write(
                                      StorageKey.isCashOutBOCbank, p0);
                                },
                              ),
                              SizedBox(
                                height: deviceHeight * 0.01,
                              ),
                              SwitchText(
                                value: controller.isCashOutBCAbank.value,
                                text: "Cash Out - BCA Bank",
                                onChanged: (p0) {
                                  controller.isCashOutBCAbank.value = p0;
                                  storage.write(
                                      StorageKey.isCashOutBCAbank, p0);
                                },
                              ),
                              SizedBox(
                                height: deviceHeight * 0.01,
                              ),
                              SwitchText(
                                value: controller.isCashOutMCBbank.value,
                                text: "Cash Out - MCB Bank",
                                onChanged: (p0) {
                                  controller.isCashOutMCBbank.value = p0;
                                  storage.write(
                                      StorageKey.isCashOutMCBbank, p0);
                                },
                              ),
                            ],
                          ),
                        ),
                        Expanded(
                          child: Column(
                            children: [
                              SwitchText(
                                value: controller.isCashOutVietinBank.value,
                                text: "Cash Out - Vietin Bank",
                                onChanged: (p0) {
                                  controller.isCashOutVietinBank.value = p0;
                                  storage.write(
                                      StorageKey.isCashOutVietinBank, p0);
                                },
                              ),
                              SizedBox(
                                height: deviceHeight * 0.01,
                              ),
                              SwitchText(
                                value: controller.isCashOutKasikornBank.value,
                                text: "Cash Out - Kasikorn",
                                onChanged: (p0) {
                                  controller.isCashOutKasikornBank.value = p0;
                                  storage.write(
                                      StorageKey.isCashOutKasikornBank, p0);
                                },
                              ),
                              SizedBox(
                                height: deviceHeight * 0.01,
                              ),
                              SwitchText(
                                value: controller.isCashOutDBSbank.value,
                                text: "Cash Out - DBS Bank",
                                onChanged: (p0) {
                                  controller.isCashOutDBSbank.value = p0;
                                  storage.write(
                                      StorageKey.isCashOutDBSbank, p0);
                                },
                              ),
                            ],
                          ),
                        ),
                        Expanded(
                          child: Column(
                            children: [
                              SwitchText(
                                value: controller.isCashOutICBCbank.value,
                                text: "Cash Out - ICBC Bank",
                                onChanged: (p0) {
                                  controller.isCashOutICBCbank.value = p0;
                                  storage.write(
                                      StorageKey.isCashOutICBCbank, p0);
                                },
                              ),
                              SizedBox(
                                height: deviceHeight * 0.01,
                              ),
                              SwitchText(
                                value: controller.isCashOutBangkokBank.value,
                                text: "Cash Out - Bangkok",
                                onChanged: (p0) {
                                  controller.isCashOutBangkokBank.value = p0;
                                  storage.write(
                                      StorageKey.isCashOutBangkokBank, p0);
                                },
                              ),
                              SizedBox(
                                height: deviceHeight * 0.01,
                              ),
                              SwitchText(
                                value: controller.isCashOutAbank.value,
                                text: "Cash Out - A Bank",
                                onChanged: (p0) {
                                  controller.isCashOutAbank.value = p0;
                                  storage.write(StorageKey.isCashOutAbank, p0);
                                },
                              )
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      }),
    );
  }
}
