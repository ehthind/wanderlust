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
        let shell = app.otherElements["shell.tab.container"]
        XCTAssertTrue(waitForNonExistence(shell))

        swipeRightToCloseGuide(in: app)

        XCTAssertTrue(shell.waitForExistence(timeout: 5))
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
        XCTAssertTrue(waitForValue("selected", on: app.buttons["shell.tab.trips"]))
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
        let shell = app.otherElements["shell.tab.container"]
        XCTAssertTrue(waitForNonExistence(shell))

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
        XCTAssertLessThanOrEqual(planButton.frame.maxY, viewport.maxY - 12)

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

        let shell = app.otherElements["shell.tab.container"]
        let shellGroup = app.otherElements["shell.tab.group"]
        let searchButton = app.buttons["shell.tab.search"]
        XCTAssertTrue(shell.waitForExistence(timeout: 5))
        XCTAssertTrue(shellGroup.waitForExistence(timeout: 5))
        XCTAssertTrue(searchButton.waitForExistence(timeout: 5))
        XCTAssertTrue(waitForValue("iconOnly", on: shellGroup))
        assertSearchButtonAppearsAboveShellGroup(searchButton, shellGroup)

        openGuide(destinationId: "dest_paris", in: app)

        let viewport = app.windows.firstMatch.frame
        XCTAssertTrue(waitForNonExistence(shell))

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
        XCTAssertLessThan(planButton.frame.maxY, viewport.maxY - 12)
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
        XCTAssertTrue(loadingState.waitForExistence(timeout: 5))

        let errorState = app.otherElements["discover.detail.errorState.dest_kyoto"]
        XCTAssertTrue(errorState.waitForExistence(timeout: 5))
        XCTAssertTrue(app.buttons["discover.detail.retryButton.dest_kyoto"].waitForExistence(timeout: 5))
    }

    func testDiscoverFeedFloatingActionsSupportSaveAndPlanning() {
        let app = launchApp()

        let parisSaveButton = app.buttons["discover.saveButton.dest_paris"]
        let parisPlanButton = app.buttons["discover.planTripButton.dest_paris"]
        XCTAssertTrue(parisSaveButton.waitForExistence(timeout: 5))
        XCTAssertTrue(parisPlanButton.waitForExistence(timeout: 5))

        tap(parisSaveButton)
        XCTAssertTrue(waitForLabel("Saved", on: parisSaveButton))

        app.swipeUp()
        XCTAssertTrue(app.buttons["discover.saveButton.dest_kyoto"].waitForExistence(timeout: 5))

        app.swipeDown()
        let returnedParisSaveButton = app.buttons["discover.saveButton.dest_paris"]
        XCTAssertTrue(returnedParisSaveButton.waitForExistence(timeout: 5))
        XCTAssertTrue(waitForLabel("Saved", on: returnedParisSaveButton))

        tap(app.buttons["discover.planTripButton.dest_paris"])
        XCTAssertTrue(app.buttons["workspace.searchButton"].waitForExistence(timeout: 5))
        XCTAssertTrue(waitForValue("selected", on: app.buttons["shell.tab.trips"]))
    }

    func testRootChromeSwitchesTabsAndTopSearchUsesSearchTab() {
        let app = launchApp()

        let shellGroup = app.otherElements["shell.tab.group"]
        let selection = app.otherElements["shell.tab.selection"]
        XCTAssertTrue(shellGroup.waitForExistence(timeout: 5))
        XCTAssertTrue(selection.waitForExistence(timeout: 5))

        let discoverButton = app.buttons["shell.tab.discover"]
        let searchButton = app.buttons["shell.tab.search"]
        XCTAssertTrue(discoverButton.waitForExistence(timeout: 5))
        XCTAssertTrue(searchButton.waitForExistence(timeout: 5))
        XCTAssertTrue(waitForValue("Discover", on: selection))
        assertSearchButtonAppearsAboveShellGroup(searchButton, shellGroup)

        tap(searchButton)
        XCTAssertTrue(waitForValue("selected", on: searchButton))
        XCTAssertTrue(app.staticTexts["Search Will Become a Precision Tool"].waitForExistence(timeout: 5))
        XCTAssertTrue(waitForNonExistence(selection))

        let inboxButton = app.buttons["shell.tab.inbox"]
        tap(inboxButton)
        XCTAssertTrue(waitForValue("selected", on: inboxButton))
        XCTAssertTrue(app.staticTexts["Inbox Lands After Stay Selection"].waitForExistence(timeout: 5))
        XCTAssertTrue(selection.waitForExistence(timeout: 5))
        XCTAssertTrue(waitForValue("Inbox", on: selection))

        let tripsButton = app.buttons["shell.tab.trips"]
        tap(tripsButton)
        XCTAssertTrue(waitForValue("selected", on: tripsButton))
        XCTAssertTrue(app.staticTexts["Your Active Trip Will Reopen Here"].waitForExistence(timeout: 5))
        XCTAssertTrue(selection.waitForExistence(timeout: 5))
        XCTAssertTrue(waitForValue("Trips", on: selection))

        tap(discoverButton)
        XCTAssertTrue(waitForValue("selected", on: discoverButton))
        XCTAssertTrue(app.otherElements["discover.card.dest_paris"].waitForExistence(timeout: 5))
        XCTAssertTrue(selection.waitForExistence(timeout: 5))
        XCTAssertTrue(waitForValue("Discover", on: selection))
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

    private func waitForNonExistence(_ element: XCUIElement, timeout: TimeInterval = 5) -> Bool {
        let predicate = NSPredicate(format: "exists == false")
        let expectation = XCTNSPredicateExpectation(predicate: predicate, object: element)
        return XCTWaiter.wait(for: [expectation], timeout: timeout) == .completed
    }

    private func assertSearchButtonAppearsAboveShellGroup(
        _ searchButton: XCUIElement,
        _ shellGroup: XCUIElement,
        file: StaticString = #filePath,
        line: UInt = #line
    ) {
        XCTAssertLessThan(searchButton.frame.maxY, shellGroup.frame.minY, file: file, line: line)
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
