if [ ! -f tiapp.xml ]; then
	echo "This is not a valid Titanium project."
	exit
fi

echo "Downloading Trimethyl.."
curl -L "https://github.com/CaffeinaLab/Trimethyl/archive/1.2.4.tar.gz" -o "T.tar.gz"
if [ ! -f "T.tar.gz" ]; then
	echo "Error while downloading Trimethyl"
	exit
fi

echo "Unzipping Trimethyl.."
mkdir -p app/lib/T
tar -xvf T.tar.gz -C app/lib/T --strip-components=1
rm T.tar.gz

echo "Symlinking.."
ln -s ../../../lib/T/assets app/assets/iphone/images/T
ln -s T/alloy app/lib/alloy

echo "Installation OK!"
