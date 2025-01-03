import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:vending/app/config/config.dart';
import 'package:vending/app/data/languages_key.dart';
import 'package:vending/widget/dialog/showdialog.dart';
import 'package:vending/widget/screens/screen_widget.dart';

void dialogSelectProductStock() {
  double deviceHeight = Get.mediaQuery.size.height;
  double deviceWidth = Get.mediaQuery.size.width;
  Get.generalDialog(
    pageBuilder: (context, animation, secondaryAnimation) {
      return ScreenWidget(
        width: deviceWidth * 0.9,
        height: deviceHeight * 0.8,
        title: Lang.selectProductToReplace.tr,
        child: Container(
          color: Colors.white,
          child: GridView.builder(
            itemCount: 30,
            gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 4,
              childAspectRatio: 2 / 4,
            ),
            itemBuilder: (context, index) {
              return Card(
                child: Column(
                  children: [
                    Expanded(
                      child: InkWell(
                        onTap: () {
                          ShowDialog.showDialogConfirm(
                            Lang.replace.tr,
                            () {},
                          );
                        },
                        child: Image.network(
                            'https://www.oishigroup.com/upload_file/beverage/190523042204_Hi-res-Oishi-500-ml-HL-TH.png'),
                      ),
                    ),
                    Text(
                      'Oishi Green Tea 500ml 15000',
                      style: TextStyle(
                        fontFamily: font,
                        fontSize: deviceHeight * 0.014,
                      ),
                    ),
                    Divider(),
                    InkWell(
                      onTap: () {
                        ShowDialog.showDialogConfirm(
                          Lang.delete.tr,
                          () {},
                        );
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
      );
    },
  );
}
