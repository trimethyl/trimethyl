if [ ! -f tiapp.xml ]; then
	echo "This is not a valid Titanium project."
	exit
fi

echo "Downloading Trimethyl.."
curl https://github.com/CaffeinaLab/Trimethyl/archive/1.2.3.tar.gz -O T.tar.gz

echo "Unzipping Trimethyl.."
mkdir -p app/lib/T
tar -xvf T.tar.gz -C app/lib/T --strip-components=1

echo "Symlinking.."
ln -s ../../../lib/T/assets app/assets/iphone/images/T
ln -s T/alloy app/lib/alloy
