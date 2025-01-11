import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:vending/app/color/main_color.dart';
import 'package:vending/app/config/config.dart';
import 'package:vending/app/routes/app_pages.dart';
import 'package:vending/widget/textfield/prefixtext_textfield.dart';
import '../controllers/setting_machine_controller.dart';

class SettingMachineView extends GetView<SettingMachineController> {
  const SettingMachineView({super.key});
  @override
  Widget build(BuildContext context) {
    double deviceHeight = MediaQuery.of(context).size.height;
    double deviceWidth = MediaQuery.of(context).size.width;
    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
            onPressed: () {
              Get.back();
              controller.homeCon.checkRestartApp();
            },
            icon: Icon(
              Icons.arrow_back,
              size: deviceHeight * 0.022,
            )),
        backgroundColor: ColorData.mainColor,
        iconTheme: IconThemeData(color: ColorData.txtColor),
        title: Text(
          'Setting',
          style: TextStyle(
              fontFamily: font,
              color: ColorData.txtColor,
              fontSize: deviceHeight * 0.02),
        ),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(8.0),
          child: Form(
            key: controller.formkey,
            child: Column(
              children: [
                SizedBox(
                  height: deviceHeight * 0.01,
                ),
                PrefixTextTextField(
                  controller: controller.wsUrl,
                  obscureText: false,
                  label: "WS-URL",
                  hintText: "Enter websocket url",
                  validator: (p0) {
                    if (p0!.isEmpty) {
                      return "Please enter WS-URL";
                    }
                    return null;
                  },
                  textInputAction: TextInputAction.next,
                ),
                SizedBox(
                  height: deviceHeight * 0.01,
                ),
                PrefixTextTextField(
                  controller: controller.url,
                  obscureText: false,
                  label: 'URL',
                  hintText: "Enter URL",
                  validator: (p0) {
                    if (p0!.isEmpty) {
                      return "Please enter URL";
                    }
                    return null;
                  },
                  textInputAction: TextInputAction.next,
                ),
                SizedBox(
                  height: deviceHeight * 0.01,
                ),
                PrefixTextTextField(
                  controller: controller.machineId,
                  obscureText: false,
                  label: 'Machine ID',
                  hintText: "Enter Machine ID",
                  validator: (p0) {
                    if (p0!.isEmpty) {
                      return "Please enter Machine ID";
                    }
                    return null;
                  },
                  keyboardType: TextInputType.number,
                  textInputAction: TextInputAction.next,
                ),
                SizedBox(height: deviceHeight * 0.01),
                PrefixTextTextField(
                  controller: controller.otp,
                  obscureText: false,
                  label: "OTP",
                  hintText: "Enter OTP",
                  validator: (p0) {
                    if (p0!.isEmpty) {
                      return "Please enter OTP";
                    }
                    return null;
                  },
                  textInputAction: TextInputAction.next,
                  keyboardType: TextInputType.number,
                ),
                SizedBox(
                  height: deviceHeight * 0.01,
                ),
                PrefixTextTextField(
                  controller: controller.contact,
                  obscureText: false,
                  label: "Contact",
                  hintText: "Enter Phone Number",
                  validator: (p0) {
                    if (p0!.isEmpty) {
                      return "Please enter Contact";
                    }
                    return null;
                  },
                  keyboardType: TextInputType.phone,
                  textInputAction: TextInputAction.next,
                ),
                SizedBox(
                  height: deviceHeight * 0.01,
                ),
                PrefixTextTextField(
                  controller: controller.fallLimit,
                  obscureText: false,
                  label: "Product Fall Limit",
                  hintText: "Enter Fall Limit",
                  validator: (p0) {
                    if (p0!.isEmpty) {
                      return "Please enter Fall Limit";
                    }
                    return null;
                  },
                  keyboardType: TextInputType.number,
                  textInputAction: TextInputAction.next,
                ),
                SizedBox(
                  height: deviceHeight * 0.01,
                ),
                Obx(() {
                  return Card(
                    elevation: 10,
                    child: ListTile(
                      onTap: () {
                        controller.adsMode.value = !controller.adsMode.value;
                      },
                      title: Text(
                        'Ads',
                        style: TextStyle(
                            fontFamily: font,
                            fontSize: deviceHeight * 0.015,
                            fontWeight: FontWeight.bold),
                      ),
                      trailing: Transform.scale(
                        scale: 2.3,
                        child: Checkbox(
                          activeColor: Colors.purple,
                          value: controller.adsMode.value,
                          onChanged: (value) {
                            controller.adsMode.value = value!;
                          },
                        ),
                      ),
                    ),
                  );
                }),
                SizedBox(
                  height: deviceHeight * 0.01,
                ),
                Obx(() {
                  return Card(
                    elevation: 10,
                    child: ListTile(
                      onTap: () {
                        controller.muteRobotSound.value =
                            !controller.muteRobotSound.value;
                      },
                      title: Text('Mute Robot Sound',
                          style: TextStyle(
                              fontFamily: font,
                              fontSize: deviceHeight * 0.015,
                              fontWeight: FontWeight.bold)),
                      trailing: Transform.scale(
                        scale: 2.3,
                        child: Checkbox(
                          activeColor: Colors.purple,
                          value: controller.muteRobotSound.value,
                          onChanged: (value) {
                            controller.muteRobotSound.value = value!;
                          },
                        ),
                      ),
                    ),
                  );
                }),
                SizedBox(
                  height: deviceHeight * 0.01,
                ),
                Obx(
                  () {
                    return Card(
                      elevation: 10,
                      child: ListTile(
                        onTap: () {
                          controller.muteMusic.value =
                              !controller.muteMusic.value;
                        },
                        title: Text('Mute Music',
                            style: TextStyle(
                                fontFamily: font,
                                fontSize: deviceHeight * 0.015,
                                fontWeight: FontWeight.bold)),
                        trailing: Transform.scale(
                          scale: 2.3,
                          child: Checkbox(
                            activeColor: Colors.purple,
                            value: controller.muteMusic.value,
                            onChanged: (value) {
                              controller.muteMusic.value = value!;
                            },
                          ),
                        ),
                      ),
                    );
                  },
                ),
                SizedBox(
                  height: deviceHeight * 0.01,
                ),
                Obx(() {
                  return controller.muteMusic.value
                      ? SizedBox()
                      : Card(
                          child: Row(
                            children: [
                              Text(
                                'Music volume',
                                style: TextStyle(
                                    fontFamily: font,
                                    fontWeight: FontWeight.bold,
                                    fontSize: deviceHeight * 0.015),
                              ),
                              Expanded(
                                child: SliderTheme(
                                  data: SliderThemeData(
                                    activeTrackColor: Colors.blue,
                                    inactiveTickMarkColor: Colors.red,
                                    trackShape: RectangularSliderTrackShape(),
                                    trackHeight: 5.0,
                                    thumbShape: RoundSliderThumbShape(
                                        enabledThumbRadius: 10.0),
                                    overlayShape: RoundSliderOverlayShape(
                                        overlayRadius: 20.0),
                                  ),
                                  child: Slider(
                                    min: 0,
                                    max: 100,
                                    value: controller.homeCon.musicVolume.value,
                                    onChanged: (value) {
                                      controller.homeCon.musicVolume.value =
                                          value;
                                    },
                                  ),
                                ),
                              ),
                              Text(
                                '${double.parse(controller.homeCon.musicVolume.value.toString()).toInt()}%',
                                style: TextStyle(
                                    fontFamily: font,
                                    fontSize: deviceHeight * 0.015),
                              )
                            ],
                          ),
                        );
                }),
                SizedBox(
                  height: deviceHeight * 0.01,
                ),
                Obx(
                  () {
                    return Card(
                      elevation: 10,
                      child: ListTile(
                        onTap: () {
                          controller.franciseMode.value =
                              !controller.franciseMode.value;
                        },
                        title: Text('Francise Mode',
                            style: TextStyle(
                                fontFamily: font,
                                fontSize: deviceHeight * 0.015,
                                fontWeight: FontWeight.bold)),
                        trailing: Transform.scale(
                          scale: 2.3,
                          child: Checkbox(
                            activeColor: Colors.purple,
                            value: controller.franciseMode.value,
                            onChanged: (value) {
                              controller.franciseMode.value = value!;
                            },
                          ),
                        ),
                      ),
                    );
                  },
                ),
                SizedBox(
                  height: deviceHeight * 0.01,
                ),
                Row(
                  children: [
                    ElevatedButton(
                      style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.blueAccent),
                      onPressed: () {
                        controller.saveSetting();
                      },
                      child: Text(
                        'SAVE',
                        style: TextStyle(
                            fontFamily: font,
                            fontSize: deviceHeight * 0.015,
                            fontWeight: FontWeight.bold,
                            color: ColorData.txtColor),
                      ),
                    ),
                    SizedBox(
                      width: 15,
                    ),
                    ElevatedButton(
                      style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.blueAccent),
                      onPressed: () {
                        controller.clearCash();
                      },
                      child: Text(
                        'RESET CASHING',
                        style: TextStyle(
                            fontFamily: font,
                            fontSize: deviceHeight * 0.015,
                            fontWeight: FontWeight.bold,
                            color: ColorData.txtColor),
                      ),
                    ),
                  ],
                ),
                SizedBox(
                  height: deviceHeight * 0.01,
                ),
                Row(
                  children: [
                    Card(
                      elevation: 10,
                      child: InkWell(
                        onTap: () {
                          Get.toNamed(Routes.SETTING_CONTROL_MENU);
                        },
                        child: Container(
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(5),
                          ),
                          height: deviceHeight * 0.08,
                          width: deviceWidth * 0.25,
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(
                                Icons.tv,
                                color: Colors.red,
                                size: deviceHeight * 0.03,
                              ),
                              Text(
                                "Control Menu",
                                style: TextStyle(
                                    fontFamily: font,
                                    fontSize: deviceHeight * 0.015,
                                    color: Colors.grey),
                              )
                            ],
                          ),
                        ),
                      ),
                    ),
                    SizedBox(
                      width: 15,
                    ),
                    Card(
                      elevation: 10,
                      child: Container(
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(5),
                        ),
                        height: deviceHeight * 0.08,
                        width: deviceWidth * 0.25,
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              Icons.settings,
                              color: Colors.red,
                              size: deviceHeight * 0.03,
                            ),
                            Text(
                              "test motor",
                              style: TextStyle(
                                  fontFamily: font,
                                  fontSize: deviceHeight * 0.015,
                                  color: Colors.grey),
                            )
                          ],
                        ),
                      ),
                    ),
                  ],
                )
              ],
            ),
          ),
        ),
      ),
    );
  }
}
