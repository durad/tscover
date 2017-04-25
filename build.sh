#!/bin/bash

export WATCH=false
export DEBUG=false
export OUTDIR="build"

while test $# -gt 0; do
	case "$1" in
		-h|--help)
			echo "Usage:"
			echo " "
			echo "    build.sh [options]"
			echo " "
			echo "    options:"
			echo "    -h, --help                show brief help"
			echo "    -w, --watch               run a continuous build"
			echo "    -o, --outdir DIR          specify a directory to store output in (default is build)"
			echo " "
			exit 0
			;;
		-o|--outDir)
			shift
			if test $# -gt 0; then
				export OUTDIR=$1
			else
				echo "No output dir specified"
				exit 1
			fi
			shift
			;;
		-w|--watch)
			export WATCH=true
			shift
			;;
		-d|--debug)
			export DEBUG=true
			shift
			;;
		*)
			shift
			continue
			;;
	esac
done

export SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
$( mkdir -p "${OUTDIR}" )
export OUTDIR_NORM="`cd "${OUTDIR}";pwd`"
export SRC_NORM="`cd "${SCRIPT_DIR}";cd "./src";pwd`"
export TEST_NORM="`cd "${SCRIPT_DIR}";cd "./test";pwd`"
export HEADER_NORM="`cd "${SCRIPT_DIR}";cd "./header";pwd`"

echo "OUTDIR_NORM=$OUTDIR_NORM"
echo "WATCH=$WATCH"
echo "DEBUG=$DEBUG"

SRC_CMD="tsc --pretty"
if [[ $WATCH == true ]]; then
	SRC_CMD="$SRC_CMD --watch"
fi
SRC_CMD="$SRC_CMD --project \"$SRC_NORM\" --outDir \"$OUTDIR_NORM\" "
# echo "SRC_CMD=$SRC_CMD"


TEST_CMD="tsc --pretty"
if [[ $WATCH == true ]]; then
	TEST_CMD="$TEST_CMD --watch"
fi
TEST_CMD="$TEST_CMD --project \"$TEST_NORM\" --outDir \"$TEST_NORM\" "
# echo "TEST_CMD=$TEST_CMD"


HEADER_CMD="node $HEADER_NORM/buildheader.js --outDir \"$OUTDIR_NORM\" "
if [[ $DEBUG == true ]]; then
	HEADER_CMD="$HEADER_CMD --debug"
fi
if [[ $WATCH == true ]]; then
	HEADER_CMD="nodemon --watch \"$HEADER_NORM\" --ext \"ts,js,less\" --exec \"${HEADER_CMD}\" "
fi
# echo "HEADER_CMD=$HEADER_CMD"

if [[ $WATCH == false ]]; then
	# echo "Compiling src:"
	echo "$SRC_CMD"
	eval "$SRC_CMD"
	# echo "Compiling tests:"
	echo "$TEST_CMD"
	eval "$TEST_CMD"
	# echo "Compiling header:"
	echo "$HEADER_CMD"
	eval "$HEADER_CMD"
	exit 0
else
	export FINALCMD="concurrently --kill-others --prefix \"[{name}]\" --names \"SRC_,TEST,HEAD\""
	FINALCMD="$FINALCMD -c \"bgGreen.black,bgBlue,bgYellow.black\""

	SRC_CMD=`echo "$SRC_CMD" | sed -e 's/\"/\\\"/g'`
	TEST_CMD=`echo "$TEST_CMD" | sed -e 's/\"/\\\"/g'`
	HEADER_CMD=`echo "$HEADER_CMD" | sed -e 's/\"/\\\"/g'`

	echo $SRC_CMD
	echo $TEST_CMD
	echo $HEADER_CMD

	FINALCMD="$FINALCMD \"$SRC_CMD\" \"$TEST_CMD\" \"$HEADER_CMD\" "
	eval "$FINALCMD"
fi

