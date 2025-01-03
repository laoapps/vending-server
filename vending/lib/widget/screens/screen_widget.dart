import 'package:flutter/material.dart';
import '../../app/color/main_color.dart';
import '../../app/config/config.dart';

class ScreenWidget extends StatelessWidget {
  final double? width;
  final double? height;
  final String title;
  final Widget child;
  final Function? onClick;
  const ScreenWidget(
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
              color: ColorData.mainColor,
              // decoration: BoxDecoration(
              //     gradient: LinearGradient(
              //         begin: Alignment.topLeft,
              //         end: Alignment.topRight,
              //         colors: [ColorData.mainColor, Colors.white])),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Center(
                    child: Text(
                      title,
                      style: TextStyle(
                          fontFamily: font,
                          fontSize: MediaQuery.of(context).size.width * 0.03,
                          color: ColorData.mainBorder),
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
            padding: const EdgeInsets.only(top: 2),
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
                child: Icon(
                  Icons.clear,
                  color: Colors.white,
                  size: MediaQuery.of(context).size.width * 0.04,
                ),
              ),
            ),
          )
        ],
      ),
    );
  }
}
