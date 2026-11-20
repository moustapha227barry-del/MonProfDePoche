package app.monprofdepoche.ui.navigation

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import app.monprofdepoche.R
import app.monprofdepoche.ui.components.PlaceholderScreen
import app.monprofdepoche.ui.home.HomeScreen

/**
 * Point unique de déclaration des écrans. Ajouter l'écran d'enregistrement ou
 * un détail de cours plus tard se fera ici, sans toucher au reste.
 */
@Composable
fun MonProfNavHost(
    navController: NavHostController,
    modifier: Modifier = Modifier,
) {
    NavHost(
        navController = navController,
        startDestination = MonProfDestination.Home.route,
        modifier = modifier,
    ) {
        composable(MonProfDestination.Home.route) {
            HomeScreen(
                onStartRecording = { navController.navigate(Routes.RECORDING) },
                onOpenBasket = { navController.openTab(MonProfDestination.Basket) },
                onOpenCourses = { navController.openTab(MonProfDestination.Courses) },
                onOpenProgress = { navController.openTab(MonProfDestination.Progress) },
            )
        }

        composable(MonProfDestination.Basket.route) {
            PlaceholderScreen(
                iconRes = R.drawable.ic_basket,
                title = stringResource(R.string.basket_title),
                subtitle = stringResource(R.string.basket_subtitle),
                features = listOf(
                    stringResource(R.string.basket_f1),
                    stringResource(R.string.basket_f2),
                    stringResource(R.string.basket_f3),
                ),
            )
        }

        composable(MonProfDestination.Courses.route) {
            PlaceholderScreen(
                iconRes = R.drawable.ic_book,
                title = stringResource(R.string.courses_title),
                subtitle = stringResource(R.string.courses_subtitle),
                features = listOf(
                    stringResource(R.string.courses_f1),
                    stringResource(R.string.courses_f2),
                    stringResource(R.string.courses_f3),
                ),
            )
        }

        composable(MonProfDestination.Tutor.route) {
            PlaceholderScreen(
                iconRes = R.drawable.ic_chat,
                title = stringResource(R.string.tutor_title),
                subtitle = stringResource(R.string.tutor_subtitle),
                features = listOf(
                    stringResource(R.string.tutor_f1),
                    stringResource(R.string.tutor_f2),
                    stringResource(R.string.tutor_f3),
                ),
            )
        }

        composable(MonProfDestination.Progress.route) {
            PlaceholderScreen(
                iconRes = R.drawable.ic_chart,
                title = stringResource(R.string.progress_title),
                subtitle = stringResource(R.string.progress_subtitle),
                features = listOf(
                    stringResource(R.string.progress_f1),
                    stringResource(R.string.progress_f2),
                    stringResource(R.string.progress_f3),
                ),
            )
        }

        composable(Routes.RECORDING) {
            PlaceholderScreen(
                iconRes = R.drawable.ic_mic,
                title = stringResource(R.string.recording_title),
                subtitle = stringResource(R.string.recording_subtitle),
                features = listOf(
                    stringResource(R.string.recording_f1),
                    stringResource(R.string.recording_f2),
                    stringResource(R.string.recording_f3),
                ),
                onBack = { navController.popBackStack() },
            )
        }
    }
}
