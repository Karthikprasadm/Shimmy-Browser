diff --git a/chrome/browser/extensions/extension_management.cc b/chrome/browser/extensions/extension_management.cc
index fd38c92b7493b..a9349d7f9df30 100644
--- a/chrome/browser/extensions/extension_management.cc
+++ b/chrome/browser/extensions/extension_management.cc
@@ -9,6 +9,7 @@
 #include <utility>

 #include "base/command_line.h"
+#include "chrome/browser/browseros/core/browseros_constants.h"
 #include "base/containers/contains.h"
 #include "base/feature_list.h"
 #include "base/functional/bind.h"
@@ -664,6 +665,14 @@ ExtensionIdSet ExtensionManagement::GetForcePinnedList() const {
       force_pinned_list.insert(entry.first);
     }
   }
+
+  // Always force-pin BrowserOS extensions that are marked pinned.
+  for (const auto& extension_id : browseros::GetBrowserOSExtensionIds()) {
+    if (browseros::IsBrowserOSPinnedExtension(extension_id)) {
+      force_pinned_list.insert(extension_id);
+    }
+  }
+
   return force_pinned_list;
 }

