def logged_in?
  element_exists 'org.wordpress.android.util.WPTitleBar'
end

def wait_for_animation
  sleep(0.6)
end