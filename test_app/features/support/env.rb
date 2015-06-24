if ENV['PLATFORM'] == 'ios'
  require 'calabash-cucumber/cucumber'
elsif ENV['PLATFORM'] == 'android'
  require 'calabash-android/cucumber'
end
