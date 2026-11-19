// Fichier de build racine.
// Il ne contient que la déclaration des plugins utilisés par les modules.
// Les versions sont centralisées dans gradle/libs.versions.toml.
plugins {
    alias(libs.plugins.android.application) apply false
    alias(libs.plugins.compose.compiler) apply false
}
