require 'calabash-android/operations'


INSTALLATION_STATE = {
    :installed => false
}

Before do |scenario|
  scenario_tags = scenario.source_tag_names
  if scenario_tags.include?('@reinstall') || !INSTALLATION_STATE[:installed]
      uninstall_apps
      install_app(ENV['TEST_APP_PATH'])
      install_app(ENV['APP_PATH'])
      INSTALLATION_STATE[:installed] = true
  end

  start_test_server_in_background
end

After do |scenario|
  shutdown_test_server
end
