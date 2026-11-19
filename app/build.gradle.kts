plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.compose.compiler)
}

android {
    // Identifiant unique de l'application (identique au package Kotlin).
    namespace = "app.monprofdepoche"

    // API Android utilisée pour compiler (Android 17, niveau 37.1).
    // Android numérote désormais des sous-niveaux (37.0, 37.1...) : la
    // syntaxe ci-dessous est la façon officielle de les désigner.
    // 37.1 est le minimum exigé par Compose 1.13 (BOM 2026.11.01).
    compileSdk {
        version = release(37) {
            minorApiLevel = 1
        }
    }

    defaultConfig {
        applicationId = "app.monprofdepoche"
        minSdk = 26
        // API visée à l'exécution : Android 16. Pourra être augmentée plus tard.
        targetSdk = 36
        versionCode = 1
        versionName = "0.1.0"
    }

    buildTypes {
        release {
            // Pas encore de minification : phase de squelette uniquement.
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro",
            )
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    buildFeatures {
        compose = true
    }
}

dependencies {
    // La BOM Compose aligne automatiquement les versions de toutes les
    // bibliothèques Compose entre elles.
    implementation(platform(libs.androidx.compose.bom))

    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.lifecycle.runtime.ktx)
    implementation(libs.androidx.activity.compose)

    implementation(libs.androidx.compose.ui)
    implementation(libs.androidx.compose.ui.graphics)
    implementation(libs.androidx.compose.ui.tooling.preview)
    implementation(libs.androidx.compose.material3)

    // Outils de prévisualisation (@Preview) uniquement en debug.
    debugImplementation(libs.androidx.compose.ui.tooling)
}
