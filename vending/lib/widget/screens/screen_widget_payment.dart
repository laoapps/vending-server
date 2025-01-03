import 'package:flutter/material.dart';
import '../../app/color/main_color.dart';
import '../../app/config/config.dart';

class ScreenPaymentWidget extends StatelessWidget {
  final double? width;
  final double? height;
  final String title;
  final Widget child;
  final Function? onClick;
  const ScreenPaymentWidget(
      {super.key,
      required this.width,
      required this.height,
      required this.title,
      required this.child,
      this.onClick});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Stack(
        alignment: Alignment.topRight,
        children: [
          Material(
            child: Container(
              width: width,
              height: height,
              color: Colors.white,
              // decoration: BoxDecoration(
              //     gradient: LinearGradient(
              //         begin: Alignment.topLeft,
              //         end: Alignment.topRight,
              //         colors: [ColorData.mainColor, Colors.white])),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  Container(
                    color: ColorData.mainColor,
                    child: Padding(
                      padding: const EdgeInsets.all(8.0),
                      child: Center(
                        child: Text(
                          title,
                          style: TextStyle(
                              fontFamily: font,
                              fontSize:
                                  MediaQuery.of(context).size.width * 0.03,
                              color: ColorData.mainBorder),
                        ),
                      ),
                    ),
                  ),
                  SizedBox(
                    height: MediaQuery.of(context).size.height * 0.005,
                  ),
                  Expanded(child: child)
                ],
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.only(top: 4),
            child: SizedBox(
              // color: Colors.orange,
              width: MediaQuery.of(context).size.width * 0.08,
              child: GestureDetector(
                onTap: () {
                  if (onClick == null) {
                    Navigator.pop(context);
                  } else {
                    onClick!();
                  }
                },
                child: Row(
                  children: [
                    Icon(
                      Icons.clear,
                      color: Colors.white,
                      size: MediaQuery.of(context).size.width * 0.03,
                    ),
                    Material(
                        color: Colors.transparent,
                        child: Text(
                          "ປິດ",
                          style: TextStyle(
                              fontFamily: font,
                              fontSize:
                                  MediaQuery.of(context).size.width * 0.03,
                              color: Colors.white),
                        )),
                  ],
                ),
              ),
            ),
          )
        ],
      ),
    );
  }
}
