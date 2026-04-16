import XCTest

@MainActor
final class WanderlustUITests: XCTestCase {
    func testDiscoverProfileOpensFromLeftSwipeAndReturnsToSameFeedCard() {
        let app = launchApp()

        let parisCard = app.otherElements["discover.card.dest_paris"]
        XCTAssertTrue(parisCard.waitForExistence(timeout: 5))

        app.swipeUp()

        let kyotoCard = app.otherElements["discover.card.dest_kyoto"]
        XCTAssertTrue(kyotoCard.waitForExistence(timeout: 5))
        XCTAssertTrue(waitForValue("current", on: kyotoCard))

        app.swipeLeft()

        let profileTitle = app.staticTexts["Kyoto"]
        XCTAssertTrue(profileTitle.waitForExistence(timeout: 5))

        let saveButton = app.buttons["Save"]
        XCTAssertTrue(saveButton.waitForExistence(timeout: 5))
        XCTAssertFalse(app.buttons["tab.discover"].exists)

        swipeRightFromLeadingEdge(in: app)

        XCTAssertTrue(kyotoCard.waitForExistence(timeout: 5))
        XCTAssertTrue(waitForValue("current", on: kyotoCard))
        XCTAssertTrue(app.buttons["tab.discover"].waitForExistence(timeout: 5))
    }

    func testDiscoverProfileSupportsSaveAndPlanningFromLaterDestination() {
        let app = launchApp()

        let parisCard = app.otherElements["discover.card.dest_paris"]
        XCTAssertTrue(parisCard.waitForExistence(timeout: 5))

        app.swipeUp()

        let kyotoCard = app.otherElements["discover.card.dest_kyoto"]
        XCTAssertTrue(kyotoCard.waitForExistence(timeout: 5))
        XCTAssertTrue(waitForValue("current", on: kyotoCard))

        app.swipeLeft()

        let profileTitle = app.staticTexts["Kyoto"]
        XCTAssertTrue(profileTitle.waitForExistence(timeout: 5))

        let saveButton = app.buttons["Save"]
        XCTAssertTrue(saveButton.waitForExistence(timeout: 5))
        saveButton.tap()
        let savedButton = app.buttons["discover.profile.saveButton.dest_kyoto"]
        XCTAssertTrue(waitForValue("saved", on: savedButton))

        let planButton = app.buttons["Plan Trip"]
        XCTAssertTrue(planButton.waitForExistence(timeout: 5))
        planButton.tap()

        let searchButton = app.buttons["workspace.searchButton"]
        XCTAssertTrue(searchButton.waitForExistence(timeout: 5))
        searchButton.tap()

        let selectButton = app.buttons["workspace.selectStay.fixture_property_kyoto_1"]
        XCTAssertTrue(selectButton.waitForExistence(timeout: 5))
        selectButton.tap()

        let selectedStayTitle = app.staticTexts["workspace.selectedStayTitle"]
        XCTAssertTrue(selectedStayTitle.waitForExistence(timeout: 5))
    }

    func testDiscoverProfileLayoutFitsWithinViewport() {
        let app = launchApp()

        let parisCard = app.otherElements["discover.card.dest_paris"]
        XCTAssertTrue(parisCard.waitForExistence(timeout: 5))

        app.swipeLeft()

        let profileTitle = app.staticTexts["Paris"]
        XCTAssertTrue(profileTitle.waitForExistence(timeout: 5))

        let viewport = app.windows.firstMatch.frame

        let bestSeasonValue = app.staticTexts["discover.profile.detail.best_season"]
        XCTAssertTrue(bestSeasonValue.waitForExistence(timeout: 5))
        XCTAssertLessThanOrEqual(bestSeasonValue.frame.maxX, viewport.maxX - 8)

        let tripLengthValue = app.staticTexts["discover.profile.detail.trip_length"]
        XCTAssertTrue(tripLengthValue.waitForExistence(timeout: 5))
        XCTAssertLessThanOrEqual(tripLengthValue.frame.maxX, viewport.maxX - 8)

        let saveButton = app.buttons["discover.profile.saveButton.dest_paris"]
        let planButton = app.buttons["discover.profile.planTripButton.dest_paris"]
        XCTAssertTrue(saveButton.waitForExistence(timeout: 5))
        XCTAssertTrue(planButton.waitForExistence(timeout: 5))
        XCTAssertEqual(saveButton.frame.midY, planButton.frame.midY, accuracy: 3)
        XCTAssertEqual(saveButton.frame.height, planButton.frame.height, accuracy: 1)

        app.swipeUp()

        let firstStoryTitle = staticText(startingWith: "Use one museum", in: app)
        let secondStoryTitle = staticText(startingWith: "Stay Left Bank", in: app)
        XCTAssertTrue(firstStoryTitle.waitForExistence(timeout: 5))
        XCTAssertTrue(secondStoryTitle.waitForExistence(timeout: 5))
        XCTAssertGreaterThanOrEqual(firstStoryTitle.frame.minX, viewport.minX + 8)
        XCTAssertLessThanOrEqual(secondStoryTitle.frame.maxX, viewport.maxX - 8)
        XCTAssertLessThan(firstStoryTitle.frame.midX, secondStoryTitle.frame.midX)
        XCTAssertEqual(firstStoryTitle.frame.minY, secondStoryTitle.frame.minY, accuracy: 18)
    }

    func testDiscoverProfileScrollsToLowerStories() {
        let app = launchApp()

        let parisCard = app.otherElements["discover.card.dest_paris"]
        XCTAssertTrue(parisCard.waitForExistence(timeout: 5))

        app.swipeUp()

        let kyotoCard = app.otherElements["discover.card.dest_kyoto"]
        XCTAssertTrue(kyotoCard.waitForExistence(timeout: 5))
        XCTAssertTrue(waitForValue("current", on: kyotoCard))

        app.swipeLeft()

        let profileTitle = app.staticTexts["Kyoto"]
        XCTAssertTrue(profileTitle.waitForExistence(timeout: 5))

        let lowerStory = staticText(startingWith: "Kyoto feels most persuasive", in: app)
        XCTAssertFalse(lowerStory.isHittable)

        for _ in 0..<3 where !lowerStory.isHittable {
            app.swipeUp()
        }

        XCTAssertTrue(lowerStory.waitForExistence(timeout: 5))
        XCTAssertTrue(lowerStory.isHittable)
    }

    private func launchApp() -> XCUIApplication {
        let app = XCUIApplication()
        app.launchEnvironment["WANDERLUST_USE_FIXTURES"] = "1"
        app.launchEnvironment["WANDERLUST_RESET_STATE"] = "1"
        app.launch()
        return app
    }

    private func swipeRightFromLeadingEdge(in app: XCUIApplication) {
        let start = app.coordinate(withNormalizedOffset: CGVector(dx: 0.04, dy: 0.5))
        let end = app.coordinate(withNormalizedOffset: CGVector(dx: 0.82, dy: 0.5))
        start.press(forDuration: 0.01, thenDragTo: end)
    }

    private func staticText(startingWith prefix: String, in app: XCUIApplication) -> XCUIElement {
        app.staticTexts.matching(NSPredicate(format: "label BEGINSWITH %@", prefix)).firstMatch
    }

    private func waitForValue(_ value: String, on element: XCUIElement, timeout: TimeInterval = 5) -> Bool {
        let predicate = NSPredicate(format: "value == %@", value)
        let expectation = XCTNSPredicateExpectation(predicate: predicate, object: element)
        return XCTWaiter.wait(for: [expectation], timeout: timeout) == .completed
    }
}
