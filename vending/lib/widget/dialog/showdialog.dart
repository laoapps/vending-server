import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:vending/widget/dialog/dialog_confirm_widget.dart';
import 'package:vending/widget/dialog/loading.dart';
import '../../app/config/config.dart';
import '../../app/data/emessage.dart';
import '../../app/data/languages_key.dart';

class ShowDialog {
  static showLoadTapError() {
    Get.dialog(SimpleDialog(
      title: Column(children: [
        const Icon(
          Icons.error,
          color: Colors.red,
          size: 50,
        ),
        const SizedBox(
          height: 10,
        ),
        Text(
          Lang.dialogFaild.tr,
          style: const TextStyle(fontSize: 18, fontFamily: font),
        )
      ]),
      children: [
        TextButton(
            onPressed: () {
              // Navigator.pop(context);
              // Navigator.pop(context);
              Get.back();
            },
            child: Text(
              Lang.btnOK.tr,
              style: const TextStyle(
                  fontSize: 18, color: Colors.black, fontFamily: font),
            ))
      ],
    ));
  }

  static showLoadError() {
    Get.dialog(SimpleDialog(
      title: Column(children: [
        const Icon(
          Icons.error,
          color: Colors.red,
          size: 50,
        ),
        const SizedBox(
          height: 10,
        ),
        Text(
          Lang.dialogFaild.tr,
          style: const TextStyle(fontSize: 18, fontFamily: font),
        )
      ]),
      children: [
        TextButton(
            onPressed: () {
              Get.back();
              Get.back();
            },
            child: Text(
              Lang.btnOK.tr,
              style: const TextStyle(
                  fontSize: 18, color: Colors.black, fontFamily: font),
            ))
      ],
    ));
  }

  static showFaild() {
    Get.dialog(SimpleDialog(
      title: Column(children: [
        const Icon(
          Icons.error,
          color: Colors.red,
          size: 50,
        ),
        const SizedBox(
          height: 10,
        ),
        Text(
          Lang.dialogFaild.tr,
          style: const TextStyle(fontSize: 18, fontFamily: font),
        )
      ]),
      children: [
        TextButton(
            onPressed: () {
              Get.back();
            },
            child: Text(
              Lang.btnOK.tr,
              style: const TextStyle(
                  fontSize: 18, color: Colors.black, fontFamily: font),
            ))
      ],
    ));
  }

  static showFaildTTlock(http.Response data) {
    Get.dialog(SimpleDialog(
      title: Column(children: [
        const Icon(
          Icons.error,
          color: Colors.red,
          size: 50,
        ),
        const SizedBox(
          height: 10,
        ),
        Text(
          jsonDecode(data.body)['data']?['errmsg']?.toString() ??
              Emessage.checkMessage(data),
          style: const TextStyle(fontSize: 18, fontFamily: font),
        )
      ]),
      children: [
        TextButton(
            onPressed: () {
              Get.back();
            },
            child: Text(
              Lang.btnOK.tr,
              style: const TextStyle(
                  fontSize: 18, color: Colors.black, fontFamily: font),
            ))
      ],
    ));
  }

  static showDialogbox(String title) {
    Get.dialog(SimpleDialog(
      title: Column(children: [
        const Icon(
          Icons.error,
          color: Colors.red,
          size: 50,
        ),
        const SizedBox(
          height: 10,
        ),
        Text(
          title,
          style: const TextStyle(fontSize: 18, fontFamily: font),
        )
      ]),
      children: [
        TextButton(
            onPressed: () {
              Get.back();
            },
            child: Text(
              Lang.btnOK.tr,
              style: const TextStyle(
                  fontSize: 18, color: Colors.black, fontFamily: font),
            ))
      ],
    ));
  }

  static showDialogSuccess(String title) {
    double deviceHeight = MediaQuery.of(Get.context!).size.height;
    Get.dialog(SimpleDialog(
      title: Column(
        children: [
          Icon(
            Icons.check_circle_outline,
            color: Colors.green,
            size: deviceHeight * 0.05,
          ),
          const SizedBox(
            height: 10,
          ),
          Text(
            title,
            style: TextStyle(fontSize: deviceHeight * 0.015, fontFamily: font),
          )
        ],
      ),
      children: [
        TextButton(
            onPressed: () {
              Get.back();
            },
            child: Text(
              Lang.btnOK.tr,
              style: TextStyle(
                  fontSize: deviceHeight * 0.015,
                  color: Colors.black,
                  fontFamily: font),
            ))
      ],
    ));
  }

  static checkDialog() {
    if (Get.isDialogOpen!) {
      Get.back();
    }
  }

  static checkButtomSheet() {
    if (Get.isBottomSheetOpen!) {
      Get.back();
    }
  }

  static showDialogConfirm(String text, Function onClick) {
    Get.dialog(
      DialogConfirmWidget(text: text, onClick: onClick),
    );
  }

  static loading() {
    Get.dialog(
      barrierDismissible: Platform.isAndroid ? false : true,
      const LoadingWidget(),
    );
  }

  static checkDialogToPop(String route) {
    if (Get.currentRoute == route) {
      Get.back();
    }
  }
}
