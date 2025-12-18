diff --git a/chrome/browser/mac/chrome_browser_main_extra_parts_mac.mm b/chrome/browser/mac/chrome_browser_main_extra_parts_mac.mm
index 6bb5ccb823895..b8bd5a800d62e 100644
--- a/chrome/browser/mac/chrome_browser_main_extra_parts_mac.mm
+++ b/chrome/browser/mac/chrome_browser_main_extra_parts_mac.mm
@@ -4,11 +4,39 @@
 
 #include "chrome/browser/mac/chrome_browser_main_extra_parts_mac.h"
 
+#include "base/logging.h"
+#include "base/strings/sys_string_conversions.h"
+#include "chrome/browser/sparkle_buildflags.h"
 #include "ui/display/screen.h"
 
+#if BUILDFLAG(ENABLE_SPARKLE)
+#include "chrome/browser/mac/sparkle_glue.h"
+#endif
+
 ChromeBrowserMainExtraPartsMac::ChromeBrowserMainExtraPartsMac() = default;
 ChromeBrowserMainExtraPartsMac::~ChromeBrowserMainExtraPartsMac() = default;
 
 void ChromeBrowserMainExtraPartsMac::PreEarlyInitialization() {
   screen_ = std::make_unique<display::ScopedNativeScreen>();
 }
+
+void ChromeBrowserMainExtraPartsMac::PreCreateMainMessageLoop() {
+#if BUILDFLAG(ENABLE_SPARKLE)
+  LOG(INFO) << "ChromeBrowserMainExtraPartsMac: PreCreateMainMessageLoop - Initializing Sparkle";
+  // Initialize Sparkle updater if available
+  @try {
+    // Just get the shared instance - actual initialization is deferred
+    SparkleGlue* sparkle = [SparkleGlue sharedSparkleGlue];
+    if (sparkle) {
+      LOG(INFO) << "ChromeBrowserMainExtraPartsMac: SparkleGlue instance obtained successfully";
+    } else {
+      LOG(WARNING) << "ChromeBrowserMainExtraPartsMac: SparkleGlue instance is nil";
+    }
+  } @catch (NSException* exception) {
+    LOG(ERROR) << "ChromeBrowserMainExtraPartsMac: NSException initializing Sparkle: " 
+               << base::SysNSStringToUTF8([exception description]);
+  } @catch (...) {
+    LOG(ERROR) << "ChromeBrowserMainExtraPartsMac: C++ exception initializing Sparkle";
+  }
+#endif
+}
