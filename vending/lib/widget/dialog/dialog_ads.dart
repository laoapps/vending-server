import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:vending/app/color/main_color.dart';
import 'package:vending/app/config/config.dart';
import 'package:video_player/video_player.dart';
import '../../app/modules/home/controllers/home_controller.dart';

void dialogShowAds() async {
  double deviceHeight = Get.mediaQuery.size.height;
  double deviceWidth = Get.mediaQuery.size.width;
  HomeController homeCon = Get.find<HomeController>();
  var result = await Get.generalDialog(
    barrierLabel: "dialogShowAds",
    barrierDismissible: true,
    pageBuilder: (context, animation, secondaryAnimation) {
      return Center(
        child: Material(
          child: IntrinsicHeight(
            child: Container(
              width: deviceWidth * 0.8,
              // height: deviceHeight * 0.8,
              decoration: BoxDecoration(
                  gradient: LinearGradient(colors: [
                Colors.red,
                Colors.redAccent.shade200,
                Colors.red
              ])),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.center,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Obx(() {
                    if (homeCon.isVideoPlay.value) {
                      return AspectRatio(
                        aspectRatio: homeCon.videoPlayerCon!.value.aspectRatio,
                        child: VideoPlayer(
                          homeCon.videoPlayerCon!,
                        ),
                      );
                    } else {
                      return Image.asset(
                          'assets/video-how-to/howto1-cover.png');
                    }
                  }),
                  SizedBox(
                    height: deviceHeight * 0.07,
                  ),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Row(
                        spacing: 10,
                        children: [
                          CircleAvatar(
                            maxRadius: deviceHeight * 0.016,
                            child: Icon(
                              Icons.phone,
                              color: ColorData.mainColor,
                              size: deviceHeight * 0.02,
                            ),
                          ),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'More Contact',
                                style: TextStyle(
                                  fontFamily: font,
                                  fontWeight: FontWeight.bold,
                                  fontSize: deviceHeight * 0.013,
                                  color: ColorData.txtColor,
                                ),
                              ),
                              Text(
                                '+85620 5551 6321',
                                style: TextStyle(
                                  fontFamily: font,
                                  color: ColorData.txtColor,
                                  fontSize: deviceHeight * 0.012,
                                ),
                              )
                            ],
                          ),
                          SizedBox(
                            width: deviceWidth * 0.02,
                          ),
                          CircleAvatar(
                            maxRadius: deviceHeight * 0.016,
                            child: Icon(
                              Icons.facebook,
                              color: ColorData.mainColor,
                              size: deviceHeight * 0.02,
                            ),
                          ),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Facebook Fan Page',
                                style: TextStyle(
                                  fontFamily: font,
                                  fontWeight: FontWeight.bold,
                                  fontSize: deviceHeight * 0.013,
                                  color: ColorData.txtColor,
                                ),
                              ),
                              Text(
                                'Dorkbouakham trading',
                                style: TextStyle(
                                  fontFamily: font,
                                  color: ColorData.txtColor,
                                  fontSize: deviceHeight * 0.012,
                                ),
                              )
                            ],
                          ),
                        ],
                      ),
                    ],
                  )
                ],
              ),
            ),
          ),
        ),
      );
    },
  );
  if (result == null) {
    print('CLOSE DIALOG');
    homeCon.checkRestartApp();
    homeCon.videoPlayerCon?.dispose();
    homeCon.isVideoPlay(false);
  }
}
