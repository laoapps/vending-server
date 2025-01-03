import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:vending/app/color/main_color.dart';
import 'package:vending/app/config/config.dart';
import 'package:vending/app/data/languages_key.dart';
import 'package:vending/app/functions/format.dart';
import 'package:vending/widget/dialog/dialog_selectproduct_stock.dart';
import '../controllers/manage_stock_controller.dart';

class ManageStockView extends GetView<ManageStockController> {
  const ManageStockView({super.key});
  @override
  Widget build(BuildContext context) {
    double deviceHeight = MediaQuery.of(context).size.height;
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
        iconTheme: IconThemeData(color: ColorData.txtColor),
        title: Text(
          Lang.manageStock.tr,
          style: TextStyle(
            fontFamily: font,
            color: ColorData.txtColor,
            fontSize: deviceHeight * 0.02,
          ),
        ),
        centerTitle: true,
      ),
      body: Obx(() {
        return GridView.builder(
          itemCount: controller.listStock.length,
          gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 4,
            childAspectRatio: 2 / 4,
          ),
          itemBuilder: (context, index) {
            var data = controller.listStock[index];
            return Card(
              elevation: 5,
              child: SizedBox(
                child: Column(
                  children: [
                    Text(
                      '${index + 1}',
                      style: TextStyle(
                        fontFamily: font,
                        fontSize: deviceHeight * 0.02,
                      ),
                    ),
                    Expanded(
                      child: InkWell(
                        onTap: () {
                          dialogSelectProductStock();
                        },
                        child: Image.network(
                          data['image'],
                        ),
                      ),
                    ),
                    Divider(),
                    Text(
                      "${Lang.price.tr}: ${Format.priceFormat(data['price'].toDouble())}",
                      style: TextStyle(
                          fontFamily: font, fontSize: deviceHeight * 0.015),
                    ),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          "${Lang.quantity.tr}: ${double.parse(data['quantity'].toString()).toInt()}",
                          style: TextStyle(
                              fontFamily: font, fontSize: deviceHeight * 0.015),
                        ),
                        Padding(
                          padding: const EdgeInsets.all(2.0),
                          child: InkWell(
                            onTap: () {
                              controller.dialogSetMax(index);
                            },
                            child: Container(
                              decoration: BoxDecoration(
                                color: Colors.blue,
                                borderRadius: BorderRadius.circular(5),
                              ),
                              padding: EdgeInsets.all(2),
                              child: Text(
                                'SET MAX',
                                style: TextStyle(
                                  fontFamily: font,
                                  fontSize: deviceHeight * 0.013,
                                  fontWeight: FontWeight.bold,
                                  color: ColorData.txtColor,
                                ),
                              ),
                            ),
                          ),
                        )
                      ],
                    ),
                    SliderTheme(
                      data: SliderThemeData(
                        activeTrackColor: Colors.blue,
                        inactiveTickMarkColor: Colors.red,
                        trackShape: RectangularSliderTrackShape(),
                        trackHeight: 10.0,
                        thumbShape:
                            RoundSliderThumbShape(enabledThumbRadius: 10.0),
                        overlayShape:
                            RoundSliderOverlayShape(overlayRadius: 20.0),
                      ),
                      child: Slider(
                        value: data['quantity'].toDouble(),
                        min: 0,
                        max: data['max'].toDouble(),
                        divisions: data['max'].toInt(),
                        onChanged: (value) {
                          // print('value: $value');
                          controller.listStock[index]['quantity'] = value;
                          controller.listStock.refresh();
                        },
                      ),
                    )
                  ],
                ),
              ),
            );
          },
        );
      }),
    );
  }
}
