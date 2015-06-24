Feature: Home Screen
  As an App Developer
  I want to see an example feature work on a default alloy app
  So that I can start using TiCalabash quickly

Scenario: See Home Screen
	Given I am on the Home Screen
	Then I should see text containing "Hello, World"
	And take picture
