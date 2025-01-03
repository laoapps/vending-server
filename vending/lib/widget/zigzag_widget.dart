import 'package:flutter/material.dart';

class ZigzagClipper extends CustomClipper<Path> {
  @override
  Path getClip(Size size) {
    double zigzagHeight = 10;
    double zigzagWidth = 20;
    Path path = Path();

    path.lineTo(0, zigzagHeight); // จุดเริ่มต้น
    for (double i = 0; i < size.width; i += zigzagWidth) {
      path.lineTo(i + zigzagWidth / 2, 0); // จุดยอด
      path.lineTo(i + zigzagWidth, zigzagHeight); // จุดล่าง
    }
    path.lineTo(size.width, 0); // ไปจนสุดขวา
    path.lineTo(size.width, size.height);
    path.lineTo(0, size.height);
    path.close();

    return path;
  }

  @override
  bool shouldReclip(CustomClipper<Path> oldClipper) => false;
}

class ZigzagWidget extends StatelessWidget {
  final double height;
  final Color color;

  const ZigzagWidget({
    Key? key,
    this.height = 50,
    this.color = Colors.red,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return ClipPath(
      clipper: ZigzagClipper(),
      child: Container(
        height: height,
        color: color,
      ),
    );
  }
}
