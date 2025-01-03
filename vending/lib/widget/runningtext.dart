// import 'package:flutter/material.dart';

// class LoadingScreen extends StatefulWidget {
//   @override
//   _LoadingScreenState createState() => _LoadingScreenState();
// }

// class _LoadingScreenState extends State<LoadingScreen>
//     with SingleTickerProviderStateMixin {
//   late AnimationController _controller;
//   late Animation<Offset> _animation;

//   @override
//   void initState() {
//     super.initState();
//     _controller =
//         AnimationController(vsync: this, duration: Duration(seconds: 2));
//     _animation = Tween<Offset>(
//       begin: Offset(-1.0, 0.0),
//       end: Offset(1.0, 0.0),
//     ).animate(CurvedAnimation(
//       parent: _controller,
//       curve: Curves.linear,
//     ));
//     _controller.repeat(reverse: true);
//   }

//   @override
//   Widget build(BuildContext context) {
//     return Center(
//       child: SlideTransition(
//         position: _animation,
//         child: Text(
//           'Loading...',
//           style: TextStyle(fontSize: 24),
//         ),
//       ),
//     );
//   }

//   @override
//   void dispose() {
//     _controller.dispose();
//     super.dispose();
//   }
// }
