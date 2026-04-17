import XCTest

@MainActor
final class WanderlustUITests: XCTestCase {
    func testDiscoverDestinationGuideSwipesInAndOutOnSameFeedCard() {
        let app = launchApp()

        let parisCard = app.otherElements["discover.card.dest_paris"]
        XCTAssertTrue(parisCard.waitForExistence(timeout: 5))
        XCTAssertFalse(app.buttons["discover.card.open.dest_paris"].exists)

        app.swipeUp()

        let kyotoCard = app.otherElements["discover.card.dest_kyoto"]
        XCTAssertTrue(kyotoCard.waitForExistence(timeout: 5))
        XCTAssertTrue(waitForValue("current", on: kyotoCard))
        XCTAssertFalse(app.buttons["discover.card.open.dest_kyoto"].exists)

        openGuide(destinationId: "dest_kyoto", in: app)
        XCTAssertTrue(app.tabBars.buttons["Discover"].waitForExistence(timeout: 5))

        swipeRightToCloseGuide(in: app)

        XCTAssertTrue(kyotoCard.waitForExistence(timeout: 5))
        XCTAssertTrue(waitForValue("current", on: kyotoCard))
    }

    func testDiscoverDestinationGuideBackButtonReturnsToSameFeedCard() {
        let app = launchApp()

        let parisCard = app.otherElements["discover.card.dest_paris"]
        XCTAssertTrue(parisCard.waitForExistence(timeout: 5))

        app.swipeUp()

        let kyotoCard = app.otherElements["discover.card.dest_kyoto"]
        XCTAssertTrue(kyotoCard.waitForExistence(timeout: 5))
        XCTAssertTrue(waitForValue("current", on: kyotoCard))

        openGuide(destinationId: "dest_kyoto", in: app)

        let backButton = app.buttons["discover.detail.backButton"]
        XCTAssertTrue(backButton.waitForExistence(timeout: 5))
        tap(backButton)

        XCTAssertTrue(kyotoCard.waitForExistence(timeout: 5))
        XCTAssertTrue(waitForValue("current", on: kyotoCard))
    }

    func testDiscoverDestinationGuideSupportsSaveAndPlanningFromLaterDestination() {
        let app = launchApp()

        let parisCard = app.otherElements["discover.card.dest_paris"]
        XCTAssertTrue(parisCard.waitForExistence(timeout: 5))

        app.swipeUp()

        let kyotoCard = app.otherElements["discover.card.dest_kyoto"]
        XCTAssertTrue(kyotoCard.waitForExistence(timeout: 5))
        XCTAssertTrue(waitForValue("current", on: kyotoCard))

        openGuide(destinationId: "dest_kyoto", in: app)

        let saveButton = app.buttons["discover.detail.saveButton.dest_kyoto"]
        XCTAssertTrue(saveButton.waitForExistence(timeout: 5))
        tap(saveButton)
        XCTAssertTrue(waitForLabel("Saved", on: saveButton))

        let planButton = app.buttons["discover.detail.planButton.dest_kyoto"]
        XCTAssertTrue(planButton.waitForExistence(timeout: 5))
        tap(planButton)

        let searchButton = app.buttons["workspace.searchButton"]
        XCTAssertTrue(searchButton.waitForExistence(timeout: 5))
        tap(searchButton)

        let selectButton = app.buttons["workspace.selectStay.fixture_property_kyoto_1"]
        XCTAssertTrue(selectButton.waitForExistence(timeout: 5))
    }

    func testDiscoverDestinationGuideLayoutFitsWithinViewport() {
        let app = launchApp()

        let parisCard = app.otherElements["discover.card.dest_paris"]
        XCTAssertTrue(parisCard.waitForExistence(timeout: 5))

        openGuide(destinationId: "dest_paris", in: app)

        let viewport = app.windows.firstMatch.frame
        let tabBar = app.tabBars.firstMatch

        let bestSeasonValue = app.otherElements["discover.detail.value.best_season"]
        scrollToElement(bestSeasonValue, in: app, direction: .up)
        XCTAssertTrue(bestSeasonValue.waitForExistence(timeout: 5))
        XCTAssertLessThan(bestSeasonValue.frame.maxX, viewport.maxX - 12)

        let tripLengthValue = app.otherElements["discover.detail.value.trip_length"]
        scrollToElement(tripLengthValue, in: app, direction: .up)
        XCTAssertTrue(tripLengthValue.waitForExistence(timeout: 5))
        XCTAssertLessThan(tripLengthValue.frame.maxX, viewport.maxX - 12)

        let planButton = app.buttons["discover.detail.planButton.dest_paris"]
        XCTAssertTrue(planButton.waitForExistence(timeout: 5))
        XCTAssertLessThan(planButton.frame.maxY, tabBar.frame.minY)

        let firstStory = app.otherElements["discover.detail.story.paris-story-1"]
        let secondStory = app.otherElements["discover.detail.story.paris-story-2"]
        XCTAssertTrue(firstStory.waitForExistence(timeout: 5))
        XCTAssertTrue(secondStory.waitForExistence(timeout: 5))
        XCTAssertLessThan(firstStory.frame.minX, secondStory.frame.minX)
    }

    func testDiscoverDestinationGuideSupportsAccessibilityDynamicType() {
        let app = launchApp(dynamicTypeSize: "accessibility3")

        let parisCard = app.otherElements["discover.card.dest_paris"]
        XCTAssertTrue(parisCard.waitForExistence(timeout: 5))

        openGuide(destinationId: "dest_paris", in: app)

        let viewport = app.windows.firstMatch.frame
        let tabBar = app.tabBars.firstMatch

        let bestSeasonValue = app.otherElements["discover.detail.value.best_season"]
        scrollToElement(bestSeasonValue, in: app, direction: .up)
        XCTAssertTrue(bestSeasonValue.waitForExistence(timeout: 5))
        XCTAssertLessThan(bestSeasonValue.frame.maxX, viewport.maxX - 12)

        let tripLengthValue = app.otherElements["discover.detail.value.trip_length"]
        scrollToElement(tripLengthValue, in: app, direction: .up)
        XCTAssertTrue(tripLengthValue.waitForExistence(timeout: 5))
        XCTAssertLessThan(tripLengthValue.frame.maxX, viewport.maxX - 12)

        let planButton = app.buttons["discover.detail.planButton.dest_paris"]
        XCTAssertTrue(planButton.waitForExistence(timeout: 5))
        XCTAssertLessThan(planButton.frame.maxY, tabBar.frame.minY)
    }

    func testDiscoverDestinationGuideLoadingAndErrorStatesAreAccessible() {
        let app = launchApp(profileDelayMs: 5000, failedProfileDestinationId: "dest_kyoto")

        let parisCard = app.otherElements["discover.card.dest_paris"]
        XCTAssertTrue(parisCard.waitForExistence(timeout: 5))

        app.swipeUp()

        let kyotoCard = app.otherElements["discover.card.dest_kyoto"]
        XCTAssertTrue(kyotoCard.waitForExistence(timeout: 5))

        openGuide(destinationId: "dest_kyoto", in: app)

        let loadingState = app.otherElements["discover.detail.loadingState.dest_kyoto"]
        XCTAssertTrue(loadingState.waitForExistence(timeout: 2))

        let errorState = app.otherElements["discover.detail.errorState.dest_kyoto"]
        XCTAssertTrue(errorState.waitForExistence(timeout: 5))
        XCTAssertTrue(app.buttons["discover.detail.retryButton.dest_kyoto"].waitForExistence(timeout: 5))
    }

    private func launchApp(
        dynamicTypeSize: String? = nil,
        profileDelayMs: Int? = nil,
        failedProfileDestinationId: String? = nil
    ) -> XCUIApplication {
        let app = XCUIApplication()
        app.launchEnvironment["WANDERLUST_USE_FIXTURES"] = "1"
        app.launchEnvironment["WANDERLUST_RESET_STATE"] = "1"

        if let dynamicTypeSize {
            app.launchEnvironment["WANDERLUST_DYNAMIC_TYPE_SIZE"] = dynamicTypeSize
        }

        if let profileDelayMs {
            app.launchEnvironment["WANDERLUST_PROFILE_DELAY_MS"] = String(profileDelayMs)
        }

        if let failedProfileDestinationId {
            app.launchEnvironment["WANDERLUST_FAIL_PROFILE_DESTINATION_ID"] = failedProfileDestinationId
        }

        app.launch()
        return app
    }

    private func openGuide(destinationId: String, in app: XCUIApplication) {
        swipeLeftToOpenGuide(in: app)
        XCTAssertTrue(app.otherElements["discover.detail.screen.\(destinationId)"].waitForExistence(timeout: 5))
    }

    private func swipeLeftToOpenGuide(in app: XCUIApplication) {
        let start = app.coordinate(withNormalizedOffset: CGVector(dx: 0.84, dy: 0.55))
        let end = app.coordinate(withNormalizedOffset: CGVector(dx: 0.18, dy: 0.55))
        start.press(forDuration: 0.01, thenDragTo: end)
    }

    private func swipeRightToCloseGuide(in app: XCUIApplication) {
        let start = app.coordinate(withNormalizedOffset: CGVector(dx: 0.18, dy: 0.55))
        let end = app.coordinate(withNormalizedOffset: CGVector(dx: 0.84, dy: 0.55))
        start.press(forDuration: 0.01, thenDragTo: end)
    }

    private func tap(_ element: XCUIElement) {
        if element.isHittable {
            element.tap()
            return
        }

        element.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5)).tap()
    }

    private func waitForValue(_ value: String, on element: XCUIElement, timeout: TimeInterval = 5) -> Bool {
        let predicate = NSPredicate(format: "value == %@", value)
        let expectation = XCTNSPredicateExpectation(predicate: predicate, object: element)
        return XCTWaiter.wait(for: [expectation], timeout: timeout) == .completed
    }

    private func waitForLabel(_ label: String, on element: XCUIElement, timeout: TimeInterval = 5) -> Bool {
        let predicate = NSPredicate(format: "label == %@", label)
        let expectation = XCTNSPredicateExpectation(predicate: predicate, object: element)
        return XCTWaiter.wait(for: [expectation], timeout: timeout) == .completed
    }

    private enum ScrollDirection {
        case up
        case down
    }

    private func scrollToElement(_ element: XCUIElement, in app: XCUIApplication, direction: ScrollDirection, attempts: Int = 8) {
        guard !element.exists else { return }

        for _ in 0 ..< attempts where !element.exists {
            switch direction {
            case .up:
                app.swipeUp()
            case .down:
                app.swipeDown()
            }
        }
    }
}
