import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:intl/intl.dart';
import 'package:vending/app/config/config.dart';
import 'package:vending/app/data/languages_key.dart';
import 'package:vending/app/functions/format.dart';
import 'package:vending/app/functions/showlogs.dart';
import 'package:vending/app/routes/app_pages.dart';
import 'package:vending/widget/dialog/dialog_cashin.dart';
import 'package:vending/widget/dialog/dialog_howto.dart';
import 'package:vending/widget/dialog/dialog_myorder.dart';
import 'package:vending/widget/floatingbutton.dart';
import 'package:vending/widget/imagecached.dart';
import '../controllers/home_controller.dart';

class HomeView extends GetView<HomeController> {
  const HomeView({super.key});
  @override
  Widget build(BuildContext context) {
    double deviceHeight = MediaQuery.of(context).size.height;
    DateTime currentTime = DateTime.now();
    final formatter = DateFormat('yyyy/mm/dd - HH:mm:ss');
    return GestureDetector(
      onTap: () {
        controller.checkRestartApp();
        ShowLogs().normal('CLICK');
      },
      child: Scaffold(
        body: Obx(() {
          return Column(
            children: [
              Stack(
                alignment: Alignment.topRight,
                children: [
                  Container(
                    decoration: BoxDecoration(
                      image: DecorationImage(
                          image: AssetImage(
                            'assets/images/background.jpg',
                          ),
                          fit: BoxFit.cover),
                    ),
                    height: deviceHeight * 0.22,
                    child: Center(
                      child: InkWell(
                        onTap: () {
                          controller.connectWebSocket.countClick++;
                          if (controller.connectWebSocket.countClick == 6) {
                            Get.toNamed(Routes.MANAGE_STOCK);
                            controller.connectWebSocket.countClick = 0;
                          }
                        },
                        child: Image.asset(
                          height: deviceHeight * 0.1,
                          'assets/images/mmoney-logo.png',
                        ),
                      ),
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.only(top: 20, right: 10),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        // Text('dsd'),
                        StreamBuilder(
                          stream: Stream.periodic(
                              const Duration(seconds: 1), (i) => i),
                          builder: (context, snapshot) {
                            currentTime = DateTime.now();
                            String formattedTime =
                                formatter.format(currentTime);
                            return GestureDetector(
                              onTap: () {
                                // print('Settings');
                                controller.connectWebSocket.countClick++;
                                if (controller.connectWebSocket.countClick ==
                                    6) {
                                  Get.toNamed(Routes.SETTING_MACHINE);
                                  controller.connectWebSocket.countClick = 0;
                                }
                              },
                              child: Text(
                                formattedTime,
                                style: TextStyle(
                                    fontFamily: font,
                                    fontSize: deviceHeight * 0.018,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.black),
                              ),
                            );
                          },
                        )
                      ],
                    ),
                  )
                ],
              ),
              if (controller.isShowMoneyTab.value)
                SizedBox(
                  height: deviceHeight * 0.09,
                  child: Padding(
                    padding: const EdgeInsets.only(left: 5, right: 5),
                    child: Row(
                      children: [
                        if (controller.isTickets.value)
                          Container(
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(5),
                              color: Colors.grey,
                            ),
                            width: deviceHeight * 0.09,
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(
                                  Icons.payment,
                                  color: Colors.red,
                                  size: deviceHeight * 0.035,
                                ),
                                Text(
                                  Lang.tickets.tr,
                                  style: TextStyle(
                                      fontFamily: font,
                                      fontSize: deviceHeight * 0.015),
                                )
                              ],
                            ),
                          ),
                        if (controller.isTickets.value)
                          SizedBox(
                            width: 5,
                          ),
                        Expanded(
                          child: InkWell(
                            onTap: () {
                              if (controller.isCashIn.value) {
                                dialogCashIn();
                              }
                            },
                            child: Container(
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(5),
                                gradient: LinearGradient(colors: [
                                  Colors.black87,
                                  Colors.black54,
                                  Colors.black87
                                ]),
                                // color: Colors.black87,
                                image: DecorationImage(
                                  image: ExactAssetImage(
                                    'assets/images/LAAB-logo.png',
                                  ),
                                  fit: BoxFit.contain,
                                ),
                              ),
                              child: Center(
                                child: Text(
                                  Format.priceFormat(controller
                                      .connectWebSocket.balance.value),
                                  style: TextStyle(
                                    fontFamily: font,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.white,
                                    fontSize: deviceHeight * 0.05,
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ),
                        if (controller.isCashOut.value)
                          SizedBox(
                            width: 5,
                          ),
                        if (controller.isCashOut.value)
                          Container(
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(5),
                              color: Colors.grey,
                            ),
                            width: deviceHeight * 0.09,
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(
                                  Icons.attach_money,
                                  color: Colors.red,
                                  size: deviceHeight * 0.035,
                                ),
                                Text(
                                  Lang.cashout.tr,
                                  style: TextStyle(
                                      fontFamily: font,
                                      fontSize: deviceHeight * 0.015),
                                )
                              ],
                            ),
                          ),
                      ],
                    ),
                  ),
                ),
              SizedBox(
                height: deviceHeight * 0.005,
              ),
              if (controller.franciseMode.value)
                Container(
                  height: deviceHeight * 0.05,
                  padding: EdgeInsets.only(left: 5, right: 5),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Card(
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(3)),
                        elevation: 5,
                        child: Row(
                          children: [
                            Padding(
                              padding: const EdgeInsets.all(3.0),
                              child:
                                  Image.asset('assets/images/hangmistore.jpeg'),
                            ),
                            Text(
                              ' Hangmi Store  ',
                              style: TextStyle(
                                  fontFamily: font,
                                  fontSize: deviceHeight * 0.015),
                            ),
                          ],
                        ),
                      ),
                      Card(
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(3)),
                        elevation: 5,
                        child: Row(
                          children: [
                            Padding(
                              padding: const EdgeInsets.all(3.0),
                              child:
                                  Image.asset('assets/images/hangmifood.png'),
                            ),
                            Text(
                              ' Hangmi Food  ',
                              style: TextStyle(
                                  fontFamily: font,
                                  fontSize: deviceHeight * 0.015),
                            ),
                          ],
                        ),
                      ),
                      Card(
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(3)),
                        elevation: 5,
                        child: Row(
                          children: [
                            Padding(
                              padding: const EdgeInsets.all(3.0),
                              child: Image.asset(
                                  'assets/images/topupandservices.jpeg'),
                            ),
                            Text(
                              ' Topup & Services  ',
                              style: TextStyle(
                                  fontFamily: font,
                                  fontSize: deviceHeight * 0.015),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              Expanded(
                child: GridView.builder(
                  itemCount: controller.listMachineSale.length,
                  gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 3,
                    childAspectRatio: 2 / 3,
                  ),
                  itemBuilder: (context, index) {
                    var data = controller.listMachineSale[index];
                    // print('DATA $data');

                    return SizedBox(
                      child: InkWell(
                        onTap: () async {
                          // var order = {
                          //   "image":
                          //       "https://www.oishigroup.com/upload_file/beverage/190523042204_Hi-res-Oishi-500-ml-HL-TH.png",
                          //   "position": index + 1,
                          //   "price": 100000 * (index + 1),
                          //   "name": "Oishi green tea 500ml"
                          // };
                          // print('DATA ${data.toJson()}');
                          controller.addOrder(data);
                          dialogMyOrder();
                          await controller.initTimeGenerateQRMmoney();
                        },
                        child: Card(
                          child: Padding(
                            padding: const EdgeInsets.all(5.0),
                            child: Column(
                              children: [
                                Row(
                                  mainAxisAlignment:
                                      MainAxisAlignment.spaceBetween,
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
                                          fontSize: deviceHeight * 0.018,
                                        ),
                                      ),
                                    ),
                                    Container(
                                      decoration: BoxDecoration(
                                        color: Colors.grey.shade400,
                                        borderRadius: BorderRadius.circular(5),
                                      ),
                                      padding: EdgeInsets.all(3),
                                      child: Text(
                                        '${Lang.remain.tr}: ${data.stock!.qtty}',
                                        style: TextStyle(
                                            fontFamily: font,
                                            color: Colors.white,
                                            fontSize: deviceHeight * 0.015,
                                            fontWeight: FontWeight.bold),
                                      ),
                                    )
                                  ],
                                ),
                                Flexible(
                                  child: CachedNetworkImageWidget(
                                    imageUrl: '$IMAGE${data.stock!.image}',
                                  ),
                                ),
                                Text(
                                  "${data.stock!.name}",
                                  style: TextStyle(
                                      fontFamily: font,
                                      fontWeight: FontWeight.bold,
                                      fontSize: deviceHeight * 0.016,
                                      overflow: TextOverflow.ellipsis),
                                  maxLines: 1,
                                ),
                                // Divider(),
                                Row(
                                  children: [
                                    Row(
                                      children: [
                                        Icon(
                                          Icons.monetization_on,
                                          size: deviceHeight * 0.025,
                                        ),
                                        Text(
                                          ':${Format.priceFormat(data.stock!.price!.toDouble())} ${Lang.kip.tr}',
                                          style: TextStyle(
                                              fontFamily: font,
                                              fontSize: deviceHeight * 0.015),
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    );
                  },
                ),
              )
            ],
          );
        }),
        floatingActionButton: Padding(
          padding: const EdgeInsets.only(bottom: 5),
          child: Obx(() {
            return Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                FloatingButtonWidget(
                  title: "TEST",
                  boxColor: Colors.redAccent,
                  icon: Icons.roundabout_left,
                  onTap: () {
                    Get.toNamed(Routes.TEST_MACHINE);
                  },
                ),
                SizedBox(
                  height: 5,
                ),
                if (controller.myOrder.length > 1)
                  FloatingButtonWidget(
                      title: "My Order",
                      boxColor: Colors.blueAccent.shade100,
                      icon: Icons.shopping_cart),
                if (controller.myOrder.length > 1)
                  SizedBox(
                    height: 5,
                  ),
                if (controller.isWhatsapp.value)
                  FloatingButtonWidget(
                      title: "WA: 55516321",
                      boxColor: Colors.green,
                      icon: Icons.chat),
                if (controller.isWhatsapp.value)
                  SizedBox(
                    height: 5,
                  ),
                if (controller.isHowTo.value)
                  FloatingButtonWidget(
                    title: Lang.howToUse.tr,
                    boxColor: Colors.purple,
                    icon: Icons.video_collection_sharp,
                    onTap: () {
                      controller.checkRestartApp();
                      controller.isVideoPlay2(false);
                      controller
                          .initializeVideo("assets/video-how-to/howto1.webm");
                      controller.isVideoPlay2(true);
                      controller.videoPlayerCon?.play();
                      dialogHowToUse();
                    },
                  ),
                if (controller.isHowTo.value)
                  SizedBox(
                    height: 5,
                  ),
                FloatingButtonWidget(
                    title: "Play Games",
                    boxColor: Colors.red,
                    icon: Icons.games),
                SizedBox(
                  height: 5,
                ),
                FloatingButtonWidget(
                    title: "loading...",
                    boxColor: Colors.blue,
                    icon: Icons.vaccines),
                SizedBox(
                  height: 5,
                ),
                FloatingButtonWidget(
                    onTap: () {
                      // controller.showDialogAds();
                    },
                    title: "IOS & Android",
                    boxColor: Colors.pink,
                    icon: Icons.android)
              ],
            );
          }),
        ),
        floatingActionButtonLocation: FloatingActionButtonLocation.endContained,
      ),
    );
  }
}
