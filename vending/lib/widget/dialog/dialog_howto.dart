import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:vending/app/config/config.dart';

import '../../app/data/languages_key.dart';
import '../screens/screen_widget.dart';

void dialogHowToUse() {
  double deviceHeight = Get.mediaQuery.size.height;
  double deviceWidth = Get.mediaQuery.size.width;
  // HomeController homeCon = Get.find<HomeController>();
  Get.generalDialog(
    pageBuilder: (context, animation, secondaryAnimation) {
      return ScreenWidget(
        onClick: () {
          // Get.back();
          // homeCon.checkRestartApp();
          // homeCon.videoPlayerCon!.dispose();
          // homeCon.isVideoPlay2(false);
        },
        width: deviceWidth * 0.9,
        height: deviceHeight * 0.8,
        title: Lang.howToUse.tr,
        child: Container(
            padding: EdgeInsets.all(15),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  Colors.red,
                  Colors.redAccent.shade200,
                  Colors.red,
                ],
              ),
            ),
            child: Obx(() {
              return Row(
                children: [
                  Expanded(
                    child: InkWell(
                      onTap: () {
                        // homeCon.videoPlayerCon!.value.isPlaying
                        //     ? homeCon.videoPlayerCon!.pause()
                        //     : homeCon.videoPlayerCon!.play();
                        // homeCon.checkRestartApp();
                      },
                      child: Column(
                        children: [
                          // homeCon.isVideoPlay2.value
                          //     ? AspectRatio(
                          //         aspectRatio:
                          //             homeCon.videoPlayerCon!.value.aspectRatio,
                          //         child: VideoPlayer(
                          //           homeCon.videoPlayerCon!,
                          //         ),
                          //       )
                          //     : Image.asset(
                          //         'assets/video-how-to/howto1-cover.png',
                          //         fit: BoxFit.cover,
                          //       ),
                        ],
                      ),
                    ),
                  ),
                  Expanded(
                    child: Column(
                      children: [
                        InkWell(
                          onTap: () async {
                            // homeCon.checkRestartApp();
                            // await homeCon.initializeVideo(
                            //     'assets/video-how-to/howto1.webm');
                            // homeCon.isVideoPlay2(false);
                            // await homeCon.videoPlayerCon!.play();
                            // homeCon.isVideoPlay2(true);
                          },
                          child: Container(
                            color: Colors.white,
                            padding: EdgeInsets.all(10),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Image.asset(
                                  'assets/video-how-to/howto1-cover.png',
                                  height: deviceHeight * 0.13,
                                ),
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      'HOW TO 1',
                                      style: TextStyle(
                                        fontFamily: font,
                                        fontWeight: FontWeight.bold,
                                        fontSize: deviceHeight * 0.012,
                                      ),
                                    ),
                                    Text(
                                      'Step 1',
                                      style: TextStyle(
                                        fontFamily: font,
                                        fontSize: deviceHeight * 0.01,
                                      ),
                                    )
                                  ],
                                )
                              ],
                            ),
                          ),
                        ),
                        InkWell(
                          onTap: () async {
                            // homeCon.checkRestartApp();
                            // await homeCon.initializeVideo(
                            //     'assets/video-how-to/howto2.webm');
                            // homeCon.isVideoPlay2(false);
                            // await homeCon.videoPlayerCon!.play();
                            // homeCon.isVideoPlay2(true);
                          },
                          child: Container(
                            color: Colors.white,
                            padding: EdgeInsets.all(10),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Image.asset(
                                  'assets/video-how-to/howto2-cover.png',
                                  height: deviceHeight * 0.13,
                                ),
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      'HOW TO 2',
                                      style: TextStyle(
                                        fontFamily: font,
                                        fontWeight: FontWeight.bold,
                                        fontSize: deviceHeight * 0.012,
                                      ),
                                    ),
                                    Text(
                                      'Step 2',
                                      style: TextStyle(
                                        fontFamily: font,
                                        fontSize: deviceHeight * 0.01,
                                      ),
                                    )
                                  ],
                                )
                              ],
                            ),
                          ),
                        ),
                        InkWell(
                          onTap: () async {
                            // homeCon.checkRestartApp();
                            // await homeCon.initializeVideo(
                            //     'assets/video-how-to/howto3.webm');
                            // homeCon.isVideoPlay2(false);
                            // await homeCon.videoPlayerCon!.play();
                            // homeCon.isVideoPlay2(true);
                          },
                          child: Container(
                            color: Colors.white,
                            padding: EdgeInsets.all(10),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Image.asset(
                                  'assets/video-how-to/howto3-cover.png',
                                  height: deviceHeight * 0.13,
                                ),
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      'HOW TO 3',
                                      style: TextStyle(
                                        fontFamily: font,
                                        fontWeight: FontWeight.bold,
                                        fontSize: deviceHeight * 0.012,
                                      ),
                                    ),
                                    Text(
                                      'Step 3',
                                      style: TextStyle(
                                        fontFamily: font,
                                        fontSize: deviceHeight * 0.01,
                                      ),
                                    )
                                  ],
                                )
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              );
            })),
      );
    },
  );
}
