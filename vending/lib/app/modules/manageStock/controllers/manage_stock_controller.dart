import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:vending/app/color/main_color.dart';
import 'package:vending/widget/button/rounded_button.dart';
import 'package:vending/widget/dialog/showdialog.dart';
import 'package:vending/widget/screens/screen_widget.dart';
import 'package:vending/widget/textfield/perfix_textfield.dart';

import '../../../data/languages_key.dart';

class ManageStockController extends GetxController {
  RxList listStock = [
    {
      "price": 5000,
      "quantity": 3,
      "max": 5,
      "image":
          "https://www.oishigroup.com/upload_file/beverage/190523042204_Hi-res-Oishi-500-ml-HL-TH.png",
      "name": "Oishi 500ml",
    },
    {
      "price": 10000,
      "quantity": 1,
      "max": 5,
      "image":
          "https://www.ichitangroup.com/images/export_oem/Ichitan-Lemon.png",
      "name": "Ichitan Lemon",
    },
    {
      "price": 5000,
      "quantity": 3,
      "max": 5,
      "image":
          "https://www.oishigroup.com/upload_file/beverage/190523042204_Hi-res-Oishi-500-ml-HL-TH.png",
      "name": "Oishi 500ml",
    },
    {
      "price": 10000,
      "quantity": 1,
      "max": 5,
      "image":
          "https://www.ichitangroup.com/images/export_oem/Ichitan-Lemon.png",
      "name": "Ichitan Lemon",
    },
    {
      "price": 5000,
      "quantity": 3,
      "max": 5,
      "image":
          "https://www.oishigroup.com/upload_file/beverage/190523042204_Hi-res-Oishi-500-ml-HL-TH.png",
      "name": "Oishi 500ml",
    },
    {
      "price": 10000,
      "quantity": 1,
      "max": 5,
      "image":
          "https://www.ichitangroup.com/images/export_oem/Ichitan-Lemon.png",
      "name": "Ichitan Lemon",
    },
    {
      "price": 5000,
      "quantity": 3,
      "max": 5,
      "image":
          "https://www.oishigroup.com/upload_file/beverage/190523042204_Hi-res-Oishi-500-ml-HL-TH.png",
      "name": "Oishi 500ml",
    },
    {
      "price": 10000,
      "quantity": 1,
      "max": 5,
      "image":
          "https://www.ichitangroup.com/images/export_oem/Ichitan-Lemon.png",
      "name": "Ichitan Lemon",
    },
    {
      "price": 5000,
      "quantity": 3,
      "max": 5,
      "image":
          "https://www.oishigroup.com/upload_file/beverage/190523042204_Hi-res-Oishi-500-ml-HL-TH.png",
      "name": "Oishi 500ml",
    },
    {
      "price": 10000,
      "quantity": 1,
      "max": 5,
      "image":
          "https://www.ichitangroup.com/images/export_oem/Ichitan-Lemon.png",
      "name": "Ichitan Lemon",
    },
    {
      "price": 5000,
      "quantity": 3,
      "max": 5,
      "image":
          "https://www.oishigroup.com/upload_file/beverage/190523042204_Hi-res-Oishi-500-ml-HL-TH.png",
      "name": "Oishi 500ml",
    },
    {
      "price": 10000,
      "quantity": 1,
      "max": 5,
      "image":
          "https://www.ichitangroup.com/images/export_oem/Ichitan-Lemon.png",
      "name": "Ichitan Lemon",
    },
    {
      "price": 5000,
      "quantity": 3,
      "max": 5,
      "image":
          "https://www.oishigroup.com/upload_file/beverage/190523042204_Hi-res-Oishi-500-ml-HL-TH.png",
      "name": "Oishi 500ml",
    },
    {
      "price": 10000,
      "quantity": 1,
      "max": 5,
      "image":
          "https://www.ichitangroup.com/images/export_oem/Ichitan-Lemon.png",
      "name": "Ichitan Lemon",
    },
    {
      "price": 5000,
      "quantity": 3,
      "max": 5,
      "image":
          "https://www.oishigroup.com/upload_file/beverage/190523042204_Hi-res-Oishi-500-ml-HL-TH.png",
      "name": "Oishi 500ml",
    },
    {
      "price": 10000,
      "quantity": 1,
      "max": 5,
      "image":
          "https://www.ichitangroup.com/images/export_oem/Ichitan-Lemon.png",
      "name": "Ichitan Lemon",
    },
    {
      "price": 5000,
      "quantity": 3,
      "max": 5,
      "image":
          "https://www.oishigroup.com/upload_file/beverage/190523042204_Hi-res-Oishi-500-ml-HL-TH.png",
      "name": "Oishi 500ml",
    },
    {
      "price": 10000,
      "quantity": 1,
      "max": 5,
      "image":
          "https://www.ichitangroup.com/images/export_oem/Ichitan-Lemon.png",
      "name": "Ichitan Lemon",
    },
    {
      "price": 5000,
      "quantity": 3,
      "max": 5,
      "image":
          "https://www.oishigroup.com/upload_file/beverage/190523042204_Hi-res-Oishi-500-ml-HL-TH.png",
      "name": "Oishi 500ml",
    },
    {
      "price": 10000,
      "quantity": 1,
      "max": 5,
      "image":
          "https://www.ichitangroup.com/images/export_oem/Ichitan-Lemon.png",
      "name": "Ichitan Lemon",
    },
  ].obs;
  final setMax = TextEditingController();

  @override
  void onInit() {
    super.onInit();
  }

  @override
  void onReady() {
    super.onReady();
  }

  @override
  void onClose() {
    super.onClose();
  }

  dialogSetMax(int index) {
    setMax.text =
        double.parse(listStock[index]["max"].toString()).toInt().toString();
    double deviceHeight = Get.mediaQuery.size.height;
    double deviceWidth = Get.mediaQuery.size.width;
    Get.generalDialog(
      pageBuilder: (context, animation, secondaryAnimation) {
        return ScreenWidget(
          width: deviceWidth * 0.45,
          height: deviceHeight * 0.2,
          title: Lang.setMax.tr,
          child: Container(
            color: Colors.white,
            padding: const EdgeInsets.all(10),
            child: Column(
              children: [
                PrefixTextField(
                  keyboardType: TextInputType.number,
                  prefixIcon: Icons.trending_up,
                  hintText: Lang.setMax.tr,
                  controller: setMax,
                  obscureText: false,
                ),
                SizedBox(
                  height: deviceHeight * 0.02,
                ),
                RoundedButton(
                  boxColor: ColorData.mainColor,
                  txtColor: ColorData.txtColor,
                  height: deviceHeight * 0.025,
                  width: deviceWidth * 0.18,
                  fontSize: deviceHeight * 0.015,
                  radius: 10,
                  text: Lang.save.tr,
                  onTap: () {
                    if (setMax.text.isNotEmpty &&
                        listStock[index]["max"] != int.parse(setMax.text)) {
                      Get.back();
                      listStock[index]["max"] = double.parse(setMax.text);
                      listStock.refresh();
                    } else {
                      ShowDialog.showDialogbox(Lang.errorTextFieldSetMax.tr);
                    }
                  },
                )
              ],
            ),
          ),
        );
      },
    );
  }

  // dialogSetMax(int index) {
  //   setMax.text =
  //       double.parse(listStock[index]["max"].toString()).toInt().toString();
  //   double deviceHeight = Get.mediaQuery.size.height;
  //   Get.dialog(AlertDialog(
  //     title: Text(
  //       Lang.setMax.tr,
  //       style: TextStyle(fontFamily: font, fontSize: deviceHeight * 0.025),
  //     ),
  //     content: PrefixTextField(
  //       keyboardType: TextInputType.number,
  //       prefixIcon: Icons.trending_up,
  //       hintText: Lang.setMax.tr,
  //       controller: setMax,
  //       obscureText: false,
  //     ),
  //     actions: [
  //       TextButton(
  //         child: Text(
  //           Lang.btnCancel.tr,
  //           style: TextStyle(
  //             fontFamily: font,
  //             color: Colors.red,
  //             fontSize: deviceHeight * 0.018,
  //           ),
  //         ),
  //         onPressed: () {
  //           Get.back();
  //         },
  //       ),
  //       TextButton(
  //         child: Text(
  //           Lang.btnOK.tr,
  //           style: TextStyle(
  //             fontFamily: font,
  //             color: Colors.green,
  //             fontSize: deviceHeight * 0.018,
  //           ),
  //         ),
  //         onPressed: () {
  //           if (setMax.text.isNotEmpty &&
  //               listStock[index]["max"] != int.parse(setMax.text)) {
  //             Get.back();
  //             listStock[index]["max"] = double.parse(setMax.text);
  //             listStock.refresh();
  //           } else {
  //             ShowDialog.showDialogbox(Lang.errorTextFieldSetMax.tr);
  //           }
  //         },
  //       ),
  //     ],
  //   ));
  // }
}
