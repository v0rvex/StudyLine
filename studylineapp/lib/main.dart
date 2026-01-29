// lib/main.dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'app_state.dart';
import 'screens/groups_screen.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';

// Если используешь FlutterFire CLI - подключи firebase_options.dart
// import 'firebase_options.dart';

Future<void> _firebaseInit() async {
  await Firebase.initializeApp(
    // options: DefaultFirebaseOptions.currentPlatform,
  );
  FirebaseMessaging.onBackgroundMessage(_firebaseBackgroundHandler);
}

Future<void> _firebaseBackgroundHandler(RemoteMessage message) async {
  debugPrint('FCM bg: ${message.messageId}');
}

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await _firebaseInit();
  await FirebaseMessaging.instance.requestPermission();
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});
  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(create: (_) => AppState(), child: Consumer<AppState>(
      builder: (context, app, _) {
        final light = ThemeData(
          brightness: Brightness.light,
          scaffoldBackgroundColor: Colors.white,
          colorScheme: ColorScheme.fromSeed(seedColor: Colors.blue, brightness: Brightness.light).copyWith(primary: Colors.blue),
          appBarTheme: const AppBarTheme(backgroundColor: Colors.white, foregroundColor: Colors.black, elevation: 0),
          useMaterial3: true,
        );
        final dark = ThemeData(
          brightness: Brightness.dark,
          scaffoldBackgroundColor: const Color(0xFF0A0A0A),
          colorScheme: ColorScheme.fromSeed(seedColor: Colors.blue, brightness: Brightness.dark).copyWith(primary: Colors.blue.shade700),
          appBarTheme: const AppBarTheme(backgroundColor: Colors.black, foregroundColor: Colors.white, elevation: 0),
          useMaterial3: true,

        );
        return MaterialApp(
          debugShowCheckedModeBanner: false,
          title: 'StudyLine',
          theme: light,
          darkTheme: dark,
          themeMode: app.themeMode,
          home: const GroupsScreen(),
        );
      },
    ));
  }
}
